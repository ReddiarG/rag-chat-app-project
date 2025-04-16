# backend/main.py

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ws
from app.db.database import engine
from app.db.models import Base 
from app.api import auth, conversations, messages
from app.api import vector_contexts

app = FastAPI(
    title="RAG App",
    version="1.0.0"
)

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Frontend origin (change in prod)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
# REST APIs
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["Conversations"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(vector_contexts.router, prefix="/api/vector-contexts", tags=["Vector Contexts"])

# Websockets
app.include_router(ws.router)

# Optional: Startup/shutdown events
@app.on_event("startup")
async def on_startup():
    print("🚀 App is starting up...")
    
    # Create tables using the async engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.on_event("shutdown")
async def on_shutdown():
    print("👋 App is shutting down...")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)