from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from uuid import UUID


class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"


class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    role: MessageRole
    content: str
    created_at: datetime

    class Config:
        orm_mode = True
        use_enum_values = True


class MessageBase(BaseModel):
    content: str


class MessageCreate(MessageBase):
    conversation_id: UUID


class MessageRead(BaseModel):
    id: UUID
    conversation_id: UUID
    role: MessageRole
    content: str
    created_at: datetime

    class Config:
        orm_mode = True
        use_enum_values = True