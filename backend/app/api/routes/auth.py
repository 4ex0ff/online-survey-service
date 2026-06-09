from fastapi import APIRouter, status

from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse
from app.services.auth import login_user, register_user

# Создаем изолированный роутер для авторизации
router = APIRouter()

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> RegisterResponse:
    # Передаем управление сервисному слою
    return register_user(payload)

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    return login_user(payload)