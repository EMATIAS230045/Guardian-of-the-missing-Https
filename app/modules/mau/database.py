from sqlmodel import Session
from app.config.config import engine as motor

def obtener_sesion():
    """
    Dependencia de FastAPI para inyectar la sesión de la base de datos 
    en cada petición y cerrarla automáticamente al terminar.
    """
    with Session(motor) as sesion:
        yield sesion
