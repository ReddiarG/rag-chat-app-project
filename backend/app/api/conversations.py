# backend/app/api/conversations.py

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.db.database import get_db
from app.db.models import Conversation, VectorContext
from app.schemas.conversations import ConversationCreate, ConversationOut
from app.core.dependencies import get_current_user
from app.db.models import User
from fastapi import HTTPException, status

router = APIRouter()

# @router.get("/", response_model=list[ConversationOut])
# async def get_conversations(
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     result = await db.execute(
#         select(Conversation).where(Conversation.user_id == current_user.id).order_by(Conversation.created_at.desc())
#     )
#     return result.scalars().all()

@router.get("/", response_model=list[ConversationOut])
async def get_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.vector_context))
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
    )
    conversations = result.scalars().all()

    return [
        ConversationOut(
            id=c.id,
            vector_context_id=c.vector_context_id,
            collection_name=c.vector_context.chroma_collection_name,
            description=c.vector_context.description,
            title=c.title,
            created_at=c.created_at,
        )
        for c in conversations
    ]


@router.post("/", response_model=ConversationOut)
async def create_conversation(
    conversation_data: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if the context exists
    result = await db.execute(
        select(VectorContext).where(VectorContext.id == conversation_data.vector_context_id)
    )
    context = result.scalar_one_or_none()

    if not context:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Context not found")

    # Create the conversation
    conversation = Conversation(
        title=conversation_data.title,
        vector_context_id=conversation_data.vector_context_id,
        user_id=current_user.id,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    print(conversation)

    return ConversationOut(
            id=conversation.id,
            vector_context_id=conversation.vector_context_id,
            collection_name=context.chroma_collection_name,
            description=context.description,
            title=conversation.title,
            created_at=conversation.created_at
        )
