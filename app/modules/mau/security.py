import bcrypt
import jwt
import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv, find_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database.models import TokenBloqueado
from sqlmodel import Session, select
from app.modules.mau.database import obtener_sesion

load_dotenv(find_dotenv())

SECRET_KEY = os.getenv("SECRET_KEY", "super_secreto_desarrollo") # Valor por defecto seguro para dev
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

def crear_token(datos: dict, expiracion_delta: timedelta) -> str:
    """
    Recibe un diccionario con los datos a encriptar y el tiempo de vida del token.
    Devuelve el JWT firmado.
    """
    datos_a_codificar = datos.copy()
    
    # Calcular la fecha de expiración sumando el delta a la hora actual (UTC)
    fecha_expiracion = datetime.now(timezone.utc) + expiracion_delta
    
    # Agregar la expiración al "payload" del token
    datos_a_codificar.update({"exp": fecha_expiracion})
    
    # Generar el token
    token_jwt = jwt.encode(datos_a_codificar, SECRET_KEY, algorithm=ALGORITHM)
    
    return token_jwt

def obtener_hash_contrasena(contrasena: str) -> str:
    """
    Genera un hash seguro para la contraseña utilizando bcrypt.
    """
    contrasena_bytes = contrasena.encode('utf-8')
    salt = bcrypt.gensalt()
    hash_bytes = bcrypt.hashpw(contrasena_bytes, salt)
    return hash_bytes.decode('utf-8')

def verificar_contrasena(contrasena_plana: str, contrasena_hash: str) -> bool:
    """
    Verifica si una contraseña en texto plano coincide con el hash guardado.
    """
    contrasena_bytes = contrasena_plana.encode('utf-8')
    hash_bytes = contrasena_hash.encode('utf-8')
    return bcrypt.checkpw(contrasena_bytes, hash_bytes)

# Esto le dice a FastAPI dónde está el endpoint de login (para la documentación Swagger)
# Cambiamos OAuth2PasswordBearer por HTTPBearer
esquema_seguridad = HTTPBearer()

def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials = Depends(esquema_seguridad),
    db: Session = Depends(obtener_sesion) # Inyectamos la BD aquí
):
    """
    Intercepta el header 'Authorization: Bearer <token>', revisa que no esté
    en la lista negra y valida el JWT.
    """
    token = credenciales.credentials
    
    # 1. VERIFICAR LA LISTA NEGRA
    token_revocado = db.exec(select(TokenBloqueado).where(TokenBloqueado.token == token)).first()
    if token_revocado:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesión ha sido cerrada (Token revocado).",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. VALIDAR EL JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        correo: str = payload.get("sub")
        
        if correo is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="El token no contiene la información del usuario.",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token de acceso ha expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo validar el token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
