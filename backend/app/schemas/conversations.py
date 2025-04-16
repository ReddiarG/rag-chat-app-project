# backend/app/schemas/conversations.py

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class ConversationCreate(BaseModel):
    title: str
    vector_context_id: UUID

class ConversationOut(BaseModel):
    id: UUID
    vector_context_id: UUID
    collection_name: str
    description: str
    title: str
    created_at: datetime
    