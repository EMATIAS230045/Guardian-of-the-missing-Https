from fastapi import APIRouter, Depends, status, HTTPException, Body
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import timedelta
import jwt
import logging

logger = logging.getLogger(__name__)

# Importaciones directas
from app.modules.mau.database import obtener_sesion
from app.database.models import Usuario, UsuarioCreate, UsuarioResponse, LoginRequest, TokenResponse, TokenBloqueado
from app.modules.mau.security import (
    obtener_hash_contrasena, 
    verificar_contrasena, 
    crear_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    SECRET_KEY,
    ALGORITHM,
    obtener_usuario_actual,
    esquema_seguridad
)

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def registrar_usuario(usuario_in: UsuarioCreate, sesion: AsyncSession = Depends(obtener_sesion)):
    # 1. Validar si el correo ya existe
    result = await sesion.execute(select(Usuario).where(Usuario.correo == usuario_in.correo))
    usuario_existente = result.scalar_one_or_none()
    
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado."
        )
        
    contrasena_encriptada = obtener_hash_contrasena(usuario_in.contrasena)
    
    nuevo_usuario = Usuario(
        nombre=usuario_in.nombre,
        apellido_paterno=usuario_in.apellido_paterno,
        apellido_materno=usuario_in.apellido_materno,
        correo=usuario_in.correo,
        telefono=usuario_in.telefono,
        fecha_nacimiento=usuario_in.fecha_nacimiento,
        tipo_sangre=usuario_in.tipo_sangre.value if usuario_in.tipo_sangre else None,
        contrasena_hash=contrasena_encriptada
    )
    
    sesion.add(nuevo_usuario)
    await sesion.commit()
    await sesion.refresh(nuevo_usuario)

    return nuevo_usuario


@router.post("/login", response_model=TokenResponse)
async def login_usuario(credenciales: LoginRequest, sesion: AsyncSession = Depends(obtener_sesion)):
    # El validador de LoginRequest ya normaliza el correo (lower + strip)
    correo_normalizado = credenciales.correo
    logger.info(f"[LOGIN] Intento de login con correo: '{correo_normalizado}'")

    # Búsqueda case-insensitive en la BD para mayor robustez
    result = await sesion.execute(
        select(Usuario).where(func.lower(Usuario.correo) == correo_normalizado.lower())
    )
    usuario = result.scalar_one_or_none()

    logger.info(f"[LOGIN] Usuario encontrado en BD: {usuario is not None}")

    if not usuario:
        logger.warning(f"[LOGIN] No se encontró ningún usuario con correo: '{correo_normalizado}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos."
        )

    if not verificar_contrasena(credenciales.contrasena, usuario.contrasena_hash):
        logger.warning(f"[LOGIN] Contraseña incorrecta para: '{correo_normalizado}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos."
        )

    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario está desactivado."
        )
    
    # Payload para el Access Token (Lleva datos de autorización como el rol)
    datos_access = {
        "sub": usuario.correo,
        "id_usuario": usuario.id_usuario,
        "id_rol": usuario.id_rol
    }
    access_token = crear_token(datos_access, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    # Payload para el Refresh Token (Solo necesita saber quién es el usuario)
    datos_refresh = {
        "sub": usuario.correo,
        "id_usuario": usuario.id_usuario
    }
    refresh_token = crear_token(datos_refresh, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout", status_code=status.HTTP_200_OK)
async def cerrar_sesion(
    credenciales: HTTPAuthorizationCredentials = Depends(esquema_seguridad),
    db: AsyncSession = Depends(obtener_sesion)
):
    """
    Invalida el token actual enviándolo a la lista negra.
    """
    token_actual = credenciales.credentials
    
    # Verificamos si por alguna razón el token ya estaba bloqueado
    result = await db.execute(select(TokenBloqueado).where(TokenBloqueado.token == token_actual))
    token_existente = result.scalar_one_or_none()
    
    if not token_existente:
        # Lo agregamos a la lista negra
        nuevo_bloqueo = TokenBloqueado(token=token_actual)
        db.add(nuevo_bloqueo)
        await db.commit()
        
    return {"mensaje": "Sesión cerrada exitosamente."}

@router.post("/refresh", response_model=TokenResponse)
async def renovar_token(refresh_token: str = Body(..., embed=True)):
    """
    Recibe un refresh_token en el body: {"refresh_token": "tu_token..."}
    Devuelve un nuevo access_token manteniendo el mismo refresh_token.
    """
    try:
        # 1. Validar y decodificar el Refresh Token
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        correo: str = payload.get("sub")
        id_usuario: int = payload.get("id_usuario")
        
        if correo is None or id_usuario is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Token inválido"
            )
        
        # Opcional: Aquí podrías consultar la BD usando el id_usuario para 
        # verificar que la cuenta no haya sido desactivada en los últimos días
        # y para inyectar su id_rol actualizado en el nuevo access token.
        # Por ahora, confiaremos en los datos del token original.

        # 2. Generar el nuevo Access Token
        datos_access = {
            "sub": correo,
            "id_usuario": id_usuario,
            "id_rol": 1  # Si haces la consulta a BD, pon aquí el rol real
        }
        nuevo_access_token = crear_token(datos_access, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        
        # 3. Devolver los tokens
        return {
            "access_token": nuevo_access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="El Refresh Token ha expirado. Por favor, inicie sesión nuevamente."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="No se pudo validar el token."
        )

@router.get("/prueba-protegida")
async def ruta_protegida_de_prueba(datos_usuario: dict = Depends(obtener_usuario_actual)):
    """
    Ruta para probar el fallo y éxito de los Access Tokens.
    Solo se puede acceder si 'obtener_usuario_actual' no lanza un error.
    """
    return {
        "mensaje": "¡Éxito! Tienes acceso a esta ruta protegida.",
        "datos_del_token": datos_usuario
    }
