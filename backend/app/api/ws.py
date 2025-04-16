# backend/app/api/ws.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.websockets.manager import manager
from uuid import UUID
from app.core.dependencies import get_current_user
from app.db.models import User
from fastapi import Query

router = APIRouter()

@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: UUID,
    # token: str = Query(...),
):
    try:
        await manager.connect(conversation_id, websocket)
        while True:
            await websocket.receive_text()  # Optional: could just wait for connection unless you want ping/pong
    except WebSocketDisconnect:
        manager.disconnect(conversation_id)