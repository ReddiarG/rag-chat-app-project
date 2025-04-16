# backend/app/schemas/auth.py

from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    created_at: datetime

# Combined auth response with token and user
class AuthResponse(BaseModel):
    user: UserResponse
    token: str