from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.modules.mau.database import obtener_sesion
from app.database.models import Usuario, UsuarioUpdate, UsuarioResponse
from app.modules.mau.security import obtener_usuario_actual, obtener_hash_contrasena

router = APIRouter(prefix="/usuarios", tags=["Gestión de Usuarios"])

# ==========================================
# R (READ): Leer el perfil del usuario actual
# ==========================================
@router.get("/me", response_model=UsuarioResponse)
def leer_perfil(
    datos_token: dict = Depends(obtener_usuario_actual),
    db: Session = Depends(obtener_sesion)
):
    """Obtiene los datos del usuario que tiene la sesión iniciada."""
    correo = datos_token.get("sub")
    usuario = db.exec(select(Usuario).where(Usuario.correo == correo)).first()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado en la base de datos")
        
    return usuario


# ==========================================
# U (UPDATE): Actualizar el perfil del usuario
# ==========================================
@router.patch("/me", response_model=UsuarioResponse)
def actualizar_perfil(
    datos_actualizar: UsuarioUpdate,
    datos_token: dict = Depends(obtener_usuario_actual),
    db: Session = Depends(obtener_sesion)
):
    correo = datos_token.get("sub")
    usuario = db.exec(select(Usuario).where(Usuario.correo == correo)).first()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # exclude_unset=True asegura que solo tomemos los datos que el usuario envió
    datos_dict = datos_actualizar.model_dump(exclude_unset=True)
    
    if "contrasena" in datos_dict:
        password_plana = datos_dict.pop("contrasena")
        datos_dict["contrasena_hash"] = obtener_hash_contrasena(password_plana)
        
    if "tipo_sangre" in datos_dict and datos_dict["tipo_sangre"]:
        datos_dict["tipo_sangre"] = datos_dict["tipo_sangre"].value
        
    # Ahora el diccionario tiene las llaves exactas que coinciden con la BD
    for clave, valor in datos_dict.items():
        setattr(usuario, clave, valor)
        
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    
    return usuario


# ==========================================
# D (DELETE): Eliminar la cuenta del usuario
# ==========================================
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_perfil(
    datos_token: dict = Depends(obtener_usuario_actual),
    db: Session = Depends(obtener_sesion)
):
    """Elimina permanentemente la cuenta del usuario actual."""
    correo = datos_token.get("sub")
    usuario = db.exec(select(Usuario).where(Usuario.correo == correo)).first()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    db.delete(usuario)
    db.commit()
    
    return # Al usar 204_NO_CONTENT, FastAPI no devuelve cuerpo en la respuesta
