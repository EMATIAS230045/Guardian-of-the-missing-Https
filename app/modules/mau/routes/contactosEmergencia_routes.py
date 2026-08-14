from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.modules.mau.database import obtener_sesion
from app.modules.mau.security import obtener_usuario_actual
from app.database.models import (
    ContactoEmergencia,
    ContactoEmergenciaCreate,
    ContactoEmergenciaUpdate,
    ContactoEmergenciaResponse
)

router = APIRouter(
    prefix="/contactos-emergencia",
    tags=["Contactos de Emergencia"]
)

# -----------------------------------------
# 1. CREAR (POST)
# -----------------------------------------
@router.post("/", response_model=ContactoEmergenciaResponse, status_code=status.HTTP_201_CREATED)
async def crear_contacto(
    contacto: ContactoEmergenciaCreate, 
    db: AsyncSession = Depends(obtener_sesion), 
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    # CORRECCIÓN: Usamos corchetes para extraer el id_usuario del diccionario
    nuevo_contacto = ContactoEmergencia(
        **contacto.model_dump(),
        id_usuario=usuario_actual["id_usuario"] 
    )
    
    db.add(nuevo_contacto)
    await db.commit()
    await db.refresh(nuevo_contacto)
    
    return nuevo_contacto

# -----------------------------------------
# 2. LEER TODOS (GET)
# -----------------------------------------
@router.get("/", response_model=list[ContactoEmergenciaResponse])
async def obtener_mis_contactos(
    db: AsyncSession = Depends(obtener_sesion), 
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    # CORRECCIÓN: usuario_actual["id_usuario"]
    statement = select(ContactoEmergencia).where(
        ContactoEmergencia.id_usuario == usuario_actual["id_usuario"]
    ).order_by(ContactoEmergencia.prioridad.asc())
    
    result = await db.execute(statement)
    contactos = result.scalars().all()
    return contactos

# -----------------------------------------
# 3. ACTUALIZAR (PATCH)
# -----------------------------------------
@router.patch("/{id_contacto}", response_model=ContactoEmergenciaResponse)
async def actualizar_contacto(
    id_contacto: int, 
    datos_actualizar: ContactoEmergenciaUpdate, 
    db: AsyncSession = Depends(obtener_sesion), 
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    # CORRECCIÓN: usuario_actual["id_usuario"]
    statement = select(ContactoEmergencia).where(
        ContactoEmergencia.id_contacto == id_contacto,
        ContactoEmergencia.id_usuario == usuario_actual["id_usuario"]
    )
    result = await db.execute(statement)
    contacto_db = result.scalar_one_or_none()

    if not contacto_db:
        raise HTTPException(status_code=404, detail="Contacto no encontrado o no autorizado")

    datos_dict = datos_actualizar.model_dump(exclude_unset=True)
    
    for key, value in datos_dict.items():
        setattr(contacto_db, key, value)

    db.add(contacto_db)
    await db.commit()
    await db.refresh(contacto_db)
    
    return contacto_db

# -----------------------------------------
# 4. ELIMINAR (DELETE)
# -----------------------------------------
@router.delete("/{id_contacto}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_contacto(
    id_contacto: int, 
    db: AsyncSession = Depends(obtener_sesion), 
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    # CORRECCIÓN: usuario_actual["id_usuario"]
    statement = select(ContactoEmergencia).where(
        ContactoEmergencia.id_contacto == id_contacto,
        ContactoEmergencia.id_usuario == usuario_actual["id_usuario"]
    )
    result = await db.execute(statement)
    contacto_db = result.scalar_one_or_none()

    if not contacto_db:
        raise HTTPException(status_code=404, detail="Contacto no encontrado o no autorizado")

    await db.delete(contacto_db)
    await db.commit()
    return
