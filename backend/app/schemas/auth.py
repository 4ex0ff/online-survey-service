from pydantic import EmailStr, Field, field_validator
from app.schemas.base import AppModel

class RegisterRequest(AppModel):
    # Контракт для POST /api/auth/register
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return value.lower()

class LoginRequest(AppModel):
    # Контракт для POST /api/auth/login
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return value.lower()

class UserPublic(AppModel):
    # Публичные данные (Python работает в snake_case, во внешний JSON уходит camelCase)
    user_id: int = Field(serialization_alias="userID")
    name: str
    is_admin: bool = Field(serialization_alias="isAdmin")

class RegisterResponse(AppModel):
    user_id: int = Field(serialization_alias="userID")
    message: str

class LoginResponse(AppModel):
    token: str
    user: UserPublic

class AuthenticatedUser(AppModel):
    user_id: int = Field(serialization_alias="userID")
    name: str
    email: str
    is_admin: bool = Field(serialization_alias="isAdmin")