# routes/dispositivo_routes.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

# Importar el generador de sesiones de MySQL
from app.modules.mati.services.mysql.mysql import get_db

# Importar esquemas y controlador
from app.modules.mati.schemas.dispositivo import DispositivoCreate, DispositivoOut, DispositivoUpdate
from app.modules.mati.controllers import dispositivo

router = APIRouter(
    prefix="/dispositivos",
    tags=["Dispositivos"]
)


@router.post("/", response_model=DispositivoOut, status_code=status.HTTP_201_CREATED)
async def registrar_dispositivo(
    data: DispositivoCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Registra un nuevo dispositivo para un usuario.
    Si `numero_equipo` es 1 o no se especifica, calcula automáticamente el siguiente número disponible.
    """
    try:
        nuevo_dispositivo = await dispositivo.crear_dispositivo(db, data)
        return nuevo_dispositivo
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al registrar dispositivo: {str(e)}"
        )


@router.get("/usuario/{id_usuario}", response_model=List[DispositivoOut])
async def listar_dispositivos_usuario(
    id_usuario: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene todos los dispositivos activos pertenecientes a un usuario.
    """
    dispositivos = await dispositivo.obtener_dispositivos_por_usuario(db, id_usuario)
    return dispositivos


@router.get("/resolver/{id_usuario}/{numero_equipo}")
async def resolver_id_dispositivo(
    id_usuario: int,
    numero_equipo: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint de prueba/utilidad: devuelve el 'id_dispositivo' real (PK MySQL)
    dado el id_usuario y el numero_equipo.
    """
    id_real = await dispositivo.obtener_id_dispositivo_real(db, id_usuario, numero_equipo)
    
    if not id_real:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró un dispositivo #{numero_equipo} activo para el usuario {id_usuario}."
        )
        
    return {
        "id_usuario": id_usuario,
        "numero_equipo": numero_equipo,
        "id_dispositivo_real": id_real
    }


@router.put("/{id_dispositivo}/ping", status_code=status.HTTP_200_OK)
async def registrar_ping_conexion(
    id_dispositivo: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Actualiza la fecha y hora de 'ultima_conexion' del dispositivo.
    """
    await dispositivo.actualizar_conexion_dispositivo(db, id_dispositivo)
    return {"mensaje": f"Última conexión del dispositivo {id_dispositivo} actualizada exitosamente."}

@router.patch("/{id_dispositivo}", response_model=DispositivoOut)
async def actualizar_dispositivo(
    id_dispositivo: int,
    data: DispositivoUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Actualiza dinámicamente cualquier campo de un dispositivo 
    (ej. actualizar token_fcm, dar de baja con activo: false, etc.).
    """
    dispositivo_actualizado = await dispositivo.actualizar_dispositivo(
        db, id_dispositivo, data
    )
    
    if not dispositivo_actualizado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el dispositivo con ID {id_dispositivo}."
        )
        
    return dispositivo_actualizado