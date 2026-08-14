# routes/usuario_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.mati.services.mysql.mysql import get_async_db as get_mysql_session
from app.modules.mati.schemas.usuario_schemas import ConfigurarPinInput
import app.modules.mati.controllers.usuario_controller as usuario_controller

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.post("/configurar-pin")
async def configurar_pin(
    datos: ConfigurarPinInput,
    db: AsyncSession = Depends(get_mysql_session)
):
    """
    Inicializa o actualiza el PIN de seguridad del usuario (Guardado como SHA-256).
    """
    return await usuario_controller.configurar_pin_cancelacion(
        db, id_usuario=datos.id_usuario, pin_texto_plano=datos.pin
    )