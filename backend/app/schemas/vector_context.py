from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class VectorContextResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    chroma_collection_name: str
    created_at: datetime

    class Config:
        orm_mode = True