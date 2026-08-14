# controllers/usuario.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from app.database.models import Usuario
from app.modules.mati.utils.security import hash_pin

async def configurar_pin_cancelacion(db: AsyncSession, id_usuario: int, pin_texto_plano: str):
    """
    Calcula el hash SHA-256 del PIN y lo guarda en el perfil del usuario.
    """
    stmt = select(Usuario).where(Usuario.id_usuario == id_usuario)
    result = await db.execute(stmt)
    usuario = result.scalar_one_or_none()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {id_usuario} no encontrado."
        )

    # Hashear PIN con SHA-256
    usuario.pin_cancelacion = hash_pin(pin_texto_plano)
    
    # Asegurar que tenga un límite por defecto si no está definido
    if not usuario.max_intentos_pin:
        usuario.max_intentos_pin = 3

    await db.commit()
    await db.refresh(usuario)
    return {"status": "ok", "mensaje": "PIN de seguridad configurado exitosamente."}