from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.models import VectorContext
from app.schemas.vector_context import VectorContextResponse
from app.core.dependencies import get_db

router = APIRouter()

@router.get("/", response_model=List[VectorContextResponse])
async def get_vector_contexts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(VectorContext).order_by(VectorContext.created_at.desc()))
    contexts = result.scalars().all()
    return contexts