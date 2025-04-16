# backend/app/api/messages.py

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.db.models import Message, Conversation, User, VectorContext
from app.schemas.messages import MessageCreate, MessageOut, MessageRead, MessageRole
from app.core.llm_responder import generate_llm_response

from uuid import UUID

router = APIRouter()


@router.get("/{conversation_id}", response_model=list[MessageOut])
async def get_messages(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure user owns this conversation
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    )
    return result.scalars().all()

@router.post("/{conversation_id}", response_model=MessageRead)
async def create_user_message(
    conversation_id: UUID,
    message_in: MessageCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate conversation exists and belongs to user
    conversation = await db.get(Conversation, conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    # Get vector context for the conversation
    vector_context = await db.get(VectorContext, conversation.vector_context_id)
    if not vector_context:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vector context not found")

    # Save user message
    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=message_in.content,
    )
    db.add(user_message)
    await db.flush()

    # Trigger async LLM response
    background_tasks.add_task(
        generate_llm_response,
        db=db,
        user=current_user,
        conversation_id=conversation_id,
        user_message=user_message,
        vector_context=vector_context,
    )

    await db.commit()

    return MessageRead(
        id=user_message.id,
        conversation_id=user_message.conversation_id,
        role=user_message.role,
        content=user_message.content,
        created_at=user_message.created_at
    )
