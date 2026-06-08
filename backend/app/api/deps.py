from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError

from app.core.exceptions import api_http_exception
from app.core.security import decode_access_token
from app.db.pool import get_db_connection
from app.repositories.users import get_user_by_id
from app.schemas.auth import AuthenticatedUser

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
) -> AuthenticatedUser:
    # Общая зависимость для защищённых маршрутов: проверяет Bearer token и загружает пользователя из БД.
    if credentials is None:
        raise api_http_exception(401, "Unauthorized", "Требуется авторизация")

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])
    except (InvalidTokenError, KeyError, ValueError):
        raise api_http_exception(401, "Unauthorized", "Токен отсутствует или недействителен")

    with get_db_connection() as connection:
        user = get_user_by_id(connection, user_id)

    if user is None:
        raise api_http_exception(401, "Unauthorized", "Пользователь не найден")

    return AuthenticatedUser(
        user_id=user["user_id"],
        name=user["name"],
        email=user["email"],
        is_admin=user["is_admin"],
    )
