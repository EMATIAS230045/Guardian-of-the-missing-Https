from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
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
def crear_contacto(
    contacto: ContactoEmergenciaCreate, 
    db: Session = Depends(obtener_sesion), 
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    # CORRECCIÓN: Usamos corchetes para extraer el id_usuario del diccionario
    nuevo_contacto = ContactoEmergencia(
        **contacto.model_dump(),
        id_usuario=usuario_actual["id_usuario"] 
    )
    
    db.add(nuevo_contacto)
    db.commit()
    db.refresh(nuevo_contacto)
    
    return nuevo_contacto

# -----------------------------------------
# 2. LEER TODOS (GET)
# -----------------------------------------
@router.get("/", response_model=list[ContactoEmergenciaResponse])
def obtener_mis_contactos(
    db: Session = Depends(obtener_sesion), 
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    # CORRECCIÓN: usuario_actual["id_usuario"]
    statement = select(ContactoEmergencia).where(
        ContactoEmergencia.id_usuario == usuario_actual["id_usuario"]
    ).order_by(ContactoEmergencia.prioridad.asc())
    
    contactos = db.exec(statement).all()
    return contactos

# -----------------------------------------
# 3. ACTUALIZAR (PATCH)
# -----------------------------------------
@router.patch("/{id_contacto}", response_model=ContactoEmergenciaResponse)
def actualizar_contacto(
    id_contacto: int, 
    datos_actualizar: ContactoEmergenciaUpdate, 
    db: Session = Depends(obtener_sesion), 
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    # CORRECCIÓN: usuario_actual["id_usuario"]
    statement = select(ContactoEmergencia).where(
        ContactoEmergencia.id_contacto == id_contacto,
        ContactoEmergencia.id_usuario == usuario_actual["id_usuario"]
    )
    contacto_db = db.exec(statement).first()

    if not contacto_db:
        raise HTTPException(status_code=404, detail="Contacto no encontrado o no autorizado")

    datos_dict = datos_actualizar.model_dump(exclude_unset=True)
    
    for key, value in datos_dict.items():
        setattr(contacto_db, key, value)

    db.add(contacto_db)
    db.commit()
    db.refresh(contacto_db)
    
    return contacto_db

# -----------------------------------------
# 4. ELIMINAR (DELETE)
# -----------------------------------------
@router.delete("/{id_contacto}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_contacto(
    id_contacto: int, 
    db: Session = Depends(obtener_sesion), 
    usuario_actual: dict = Depends(obtener_usuario_actual)
):
    # CORRECCIÓN: usuario_actual["id_usuario"]
    statement = select(ContactoEmergencia).where(
        ContactoEmergencia.id_contacto == id_contacto,
        ContactoEmergencia.id_usuario == usuario_actual["id_usuario"]
    )
    contacto_db = db.exec(statement).first()

    if not contacto_db:
        raise HTTPException(status_code=404, detail="Contacto no encontrado o no autorizado")

    db.delete(contacto_db)
    db.commit()
    return
