import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# CONFIGURACIÓN DEL TOKEN
# ==========================================
CLAVE_SECRETA = os.getenv("SECRET_KEY")
ALGORITMO = os.getenv("ALGORITHM", "HS256") # El segundo valor es por defecto por si falla
MINUTOS_EXPIRACION_TOKEN_ACCESO = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))

# ==========================================
# FUNCIONES DE GESTIÓN DE JWT
# ==========================================

def crear_token_acceso(datos: dict, tiempo_expiracion_delta: Optional[timedelta] = None) -> str:
    """
    Recibe un diccionario con los datos del usuario (usualmente solo el 'sub' o ID)
    y devuelve una cadena de texto cifrada (el JWT).
    """
    datos_a_codificar = datos.copy()
    
    # Definir el tiempo de expiración
    if tiempo_expiracion_delta:
        expiracion = datetime.now(timezone.utc) + tiempo_expiracion_delta
    else:
        expiracion = datetime.now(timezone.utc) + timedelta(minutes=MINUTOS_EXPIRACION_TOKEN_ACCESO)
    
    # Agregar la expiración (exp) al payload del token
    # "exp" se mantiene en inglés porque es el claim estándar de JWT
    datos_a_codificar.update({"exp": expiracion})
    
    # Firmar y generar el token
    token_jwt = jwt.encode(datos_a_codificar, CLAVE_SECRETA, algorithm=ALGORITMO)
    
    return token_jwt

def verificar_token(token: str) -> dict | None:
    """
    Decodifica el token. Si es válido y no ha expirado, devuelve el payload original.
    Si fue alterado o ya expiró, devuelve None.
    """
    try:
        carga_util = jwt.decode(token, CLAVE_SECRETA, algorithms=[ALGORITMO])
        return carga_util
    except JWTError:
        return None
