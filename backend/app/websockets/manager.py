# backend/app/websockets/manager.py

from typing import Dict
from fastapi import WebSocket
from uuid import UUID

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[UUID, WebSocket] = {}

    async def connect(self, conversation_id: UUID, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[conversation_id] = websocket

    def disconnect(self, conversation_id: UUID):
        self.active_connections.pop(conversation_id, None)

    async def send_message(self, conversation_id: UUID, message: dict):
        websocket = self.active_connections.get(conversation_id)
        if websocket:
            await websocket.send_json(message)

manager = ConnectionManager()