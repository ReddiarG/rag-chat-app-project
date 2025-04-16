# backend/app/models.py

from sqlalchemy import (
    Column, String, Text, ForeignKey, Integer, DateTime, Enum, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base
import enum
import uuid

Base = declarative_base()


class RoleEnum(str, enum.Enum):
    user = "user"
    assistant = "assistant"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    conversations = relationship("Conversation", back_populates="user")


class VectorContext(Base):
    __tablename__ = "vector_contexts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    description = Column(Text)
    chroma_collection_name = Column(Text, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversations = relationship("Conversation", back_populates="vector_context")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vector_context_id = Column(UUID(as_uuid=True), ForeignKey("vector_contexts.id"))
    title = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="conversations")
    vector_context = relationship("VectorContext", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    latency_ms = Column(Integer, nullable=True)
    retrieved_docs_count = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")
    token_usage = relationship("TokenUsage", uselist=False, back_populates="message", cascade="all, delete-orphan")


class TokenUsage(Base):
    __tablename__ = "token_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, unique=True)
    input_tokens = Column(Integer, nullable=False)
    output_tokens = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    message = relationship("Message", back_populates="token_usage")