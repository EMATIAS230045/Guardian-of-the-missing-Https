from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.utils.websocket_manager import manager

router = APIRouter(prefix="/ws", tags=["WebSockets"])

@router.websocket("/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            # Mantener la conexión viva y escuchar si envían algo
            data = await websocket.receive_text()
            # Podríamos responder al mismo cliente si queremos
            # await manager.send_personal_message({"message": f"Eco: {data}"}, client_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)
