# backend/app/api/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.dependencies import get_current_user

from app.db.database import get_db
from app.db.models import User
from app.schemas.auth import RegisterRequest, LoginRequest, UserResponse, AuthResponse
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter()

@router.post("/register", response_model=AuthResponse)
async def register_user(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password)
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(data={"sub": str(new_user.id)})

    return AuthResponse(
        user=UserResponse(
            id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            created_at=new_user.created_at
        ),
        token=token
    )

@router.post("/login", response_model=AuthResponse)
async def login_user(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"sub": str(user.id)})

    return AuthResponse(
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            created_at=user.created_at
        ),
        token=token
    )


@router.get("/user", response_model=UserResponse)
async def get_user(current_user: User = Depends(get_current_user)):
    # Returns the current user's data (name, email, etc.)
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        created_at=current_user.created_at
    )
