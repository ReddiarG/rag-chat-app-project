
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.security import CHROMA_BASE_PATH, EMBEDDING_MODEL_NAME, ENCODING_MODEL_NAME, LLM_MODEL_NAME
from app.db.models import Message, TokenUsage, VectorContext, User
from uuid import UUID
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.prompts import ChatPromptTemplate
import ollama
from transformers import AutoTokenizer

PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
Do not start with "According to the provided context" and only provide relevant answer. 
Prefer using paragraphs instead of pointers unless you are listing something or the question specificly requests it.
"""

embedding_function = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)


tokenizer = AutoTokenizer.from_pretrained(ENCODING_MODEL_NAME)
def count_tokens(text: str) -> int:
    return len(tokenizer.tokenize(text))


async def construct_llm_prompt(
    db: AsyncSession,
    conversation_id: UUID,
    user_query: str,
) -> list[dict[str, str]]:
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(4)
    )
    recent_messages = result.scalars().all()
    recent_messages.reverse()

    chat_history = [
        {"role": msg.role, "content": msg.content} for msg in recent_messages
    ]

    # Include current user query as last message
    chat_history.append({"role": "user", "content": user_query})

    return chat_history

async def generate_llm_response(
    db: AsyncSession,
    user: User,
    conversation_id: UUID,
    user_message: Message,
    vector_context: VectorContext,
):
    try:
        # Load Vector Store Collection
        import os
        chroma_path = os.path.join(CHROMA_BASE_PATH, vector_context.chroma_collection_name)
        db_chroma = Chroma(
            persist_directory=chroma_path,
            collection_name=vector_context.chroma_collection_name,
            embedding_function=embedding_function
        )

        query_text = user_message.content
        results = db_chroma.similarity_search_with_relevance_scores(query_text, k=3)

        if len(results) == 0 or results[0][1] > 0.7:
            assistant_content = "I'm sorry, I couldn't find relevant context to answer your question."
            context_text = ""
        else:
            context_text = "\n\n---\n\n".join([doc.page_content for doc, _ in results])

            # Build prompt
            prompt = ChatPromptTemplate.from_template(PROMPT_TEMPLATE).format(
                context=context_text, question=query_text
            )

            # Construct final chat prompt with previous exchanges in this conversation
            chat_prompt = await construct_llm_prompt(
                db=db,
                conversation_id=conversation_id,
                user_query=prompt,
            )

            # Generate response using ollama
            response = ollama.chat(
                model=LLM_MODEL_NAME,
                messages=chat_prompt,
            )

            assistant_content = response['message']['content']

        # Save assistant message
        assistant_msg = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_content,
        )
        db.add(assistant_msg)
        await db.flush()

        # Token usage tracking
        total_input_text = "\n".join([m["content"] for m in chat_prompt]) if results else query_text
        input_tokens = count_tokens(total_input_text)
        output_tokens = count_tokens(assistant_content)

        usage = TokenUsage(
            user_id=user.id,
            message_id=assistant_msg.id,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )
        db.add(usage)
        await db.commit()

        # Send message over WebSocket
        from app.websockets.manager import manager  # import here to avoid circular import
        
        await manager.send_message(conversation_id, {
            "id": str(assistant_msg.id),
            "conversation_id": str(conversation_id),
            "role": "assistant",
            "content": assistant_content,
            "created_at": assistant_msg.created_at.isoformat()
        })

    except Exception as e:
        print(f"Error in LLM response: {e}")
        await db.rollback()
        raise