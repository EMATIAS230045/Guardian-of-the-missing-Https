# controllers/dispositivo_controller.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional

from app.database.models import Dispositivo
from app.modules.mati.schemas.dispositivo import DispositivoCreate, DispositivoUpdate


async def obtener_id_dispositivo_real(
    db: AsyncSession, 
    id_usuario: int, 
    numero_equipo: int
) -> Optional[int]:
    """
    Función para el Orquestador: Resuelve el 'id_dispositivo' (PK en MySQL)
    a partir del id_usuario y su numero_equipo relativo.
    """
    stmt = select(Dispositivo.id_dispositivo).where(
        Dispositivo.id_usuario == id_usuario,
        Dispositivo.numero_equipo == numero_equipo,
        Dispositivo.activo == True
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def crear_dispositivo(
    db: AsyncSession, 
    data: DispositivoCreate
) -> Dispositivo:
    """
    Registra un dispositivo. Si el numero_equipo no viene definido o es predeterminado,
    asigna automáticamente el siguiente entero disponible para ese usuario.
    """
    # Si se requiere auto-incrementar el numero_equipo por usuario
    if data.numero_equipo == 1:
        stmt_max = select(func.coalesce(func.max(Dispositivo.numero_equipo), 0)).where(
            Dispositivo.id_usuario == data.id_usuario
        )
        res = await db.execute(stmt_max)
        max_num = res.scalar_one()
        numero_asignado = max_num + 1
    else:
        numero_asignado = data.numero_equipo

    nuevo_dispositivo = Dispositivo(
        id_usuario=data.id_usuario,
        numero_equipo=numero_asignado,
        tipo_dispositivo=data.tipo_dispositivo,
        token_fcm=data.token_fcm,
        modelo=data.modelo,
        id_dispositivo_vinculado=data.id_dispositivo_vinculado,
        activo=True
    )

    db.add(nuevo_dispositivo)
    await db.commit()
    await db.refresh(nuevo_dispositivo)
    return nuevo_dispositivo


async def obtener_dispositivos_por_usuario(
    db: AsyncSession, 
    id_usuario: int
) -> List[Dispositivo]:
    """
    Obtiene todos los dispositivos activos pertenecientes a un usuario.
    """
    stmt = select(Dispositivo).where(
        Dispositivo.id_usuario == id_usuario,
        Dispositivo.activo == True
    ).order_by(Dispositivo.numero_equipo)
    
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def actualizar_conexion_dispositivo(
    db: AsyncSession, 
    id_dispositivo: int
) -> None:
    """
    Actualiza el timestamp de 'ultima_conexion' del dispositivo.
    """
    stmt = select(Dispositivo).where(Dispositivo.id_dispositivo == id_dispositivo)
    res = await db.execute(stmt)
    dispositivo = res.scalar_one_or_none()
    
    if dispositivo:
        dispositivo.ultima_conexion = func.now()
        await db.commit()

async def actualizar_dispositivo(
    db: AsyncSession, 
    id_dispositivo: int, 
    data: DispositivoUpdate
) -> Optional[Dispositivo]:
    """
    Actualiza de forma parcial los campos de un dispositivo (Token FCM, modelo, activo, etc.).
    """
    stmt = select(Dispositivo).where(Dispositivo.id_dispositivo == id_dispositivo)
    result = await db.execute(stmt)
    dispositivo = result.scalar_one_or_none()

    if not dispositivo:
        return None

    # Extraer solo los campos que envió el cliente en la petición
    update_data = data.model_dump(exclude_unset=True)  # Si usas Pydantic v1: data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(dispositivo, field, value)

    await db.commit()
    await db.refresh(dispositivo)
    return dispositivo