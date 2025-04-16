# backend/app/core/security.py

from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

# For password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Environment-based secret and config
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# Environment-based LLM related variables
CHROMA_BASE_PATH=Path(os.getenv("CHROMA_BASE_PATH")).resolve()
EMBEDDING_MODEL_NAME=os.getenv("EMBEDDING_MODEL_NAME")
ENCODING_MODEL_NAME=os.getenv("ENCODING_MODEL_NAME")
LLM_MODEL_NAME=os.getenv("LLM_MODEL_NAME")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)