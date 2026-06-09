import datetime
import os
from fastapi import HTTPException, status
import jwt
import psycopg2
from psycopg2.extras import RealDictCursor
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    UserPublic,
)

# Инициализируем современный хэшер Argon2 из requirements.txt
password_hash_helper = PasswordHash((Argon2Hasher(),))

JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-key-for-jwt")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def get_db_connection():
    """Создает подключение к вашей PostgreSQL."""
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "password"),
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        cursor_factory=RealDictCursor  # Возвращает строки в виде словарей
    )


def create_access_token(data: dict) -> str:
    """Генерирует JWT токен."""
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def register_user(payload: RegisterRequest) -> RegisterResponse:
    # 1. Хэшируем чистый пароль, превращая его в безопасную строку
    hashed_password = password_hash_helper.hash(payload.password)

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # 2. Проверяем, свободен ли Email. Поля оборачиваем в кавычки из-за CamelCase в Postgres
            cur.execute('SELECT "userID" FROM users WHERE "Email" = %s;', (payload.email,))
            if cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Пользователь с таким Email уже зарегистрирован",
                )

            # 3. Делаем INSERT в БД. Записываем хэш в поле "passwordHash"
            query = """
                INSERT INTO users (name, "Email", "passwordHash", "isAdmin")
                VALUES (%s, %s, %s, %s)
                RETURNING "userID";
            """
            cur.execute(query, (payload.name, payload.email, hashed_password, False))
            user_id = cur.fetchone()["userID"]
            conn.commit()

            return RegisterResponse(
                userID=user_id,
                message="Пользователь успешно зарегистрирован"
            )
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка базы данных: {str(e)}"
        )
    finally:
        conn.close()


def login_user(payload: LoginRequest) -> LoginResponse:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # 1. Ищем пользователя
            cur.execute('SELECT * FROM users WHERE "Email" = %s;', (payload.email,))
            user = cur.fetchone()

            # 2. Проверяем существование и сверяем хэш пароля
            if not user or not password_hash_helper.verify(payload.password, user["passwordHash"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Неверный Email или пароль",
                )

            # 3. Выпускаем JWT
            token = create_access_token(data={"sub": str(user["userID"]), "email": user["Email"]})

            return LoginResponse(
                token=token,
                user=UserPublic(
                    userID=user["userID"],
                    name=user["name"],
                    isAdmin=user["isAdmin"]
                )
            )
    finally:
        conn.close()