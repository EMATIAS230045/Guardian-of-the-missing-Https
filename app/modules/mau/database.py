from sqlmodel import create_engine, Session
import os
from dotenv import load_dotenv

load_dotenv()
# TODO: Reemplaza esto con tu cadena de conexión real (MySQL, PostgreSQL, etc.)
# Ejemplo para pruebas locales con SQLite:
URL_BASE_DATOS = os.getenv("MYSQL_URL") or os.getenv("DATABASE_URL")

if not URL_BASE_DATOS:
    raise ValueError("¡Error! Debes definir MYSQL_URL o DATABASE_URL en tu archivo .env")

# Asegurar que Mau (que usa sincrónico) use el driver pymysql incluso si la URL es async
if URL_BASE_DATOS.startswith("mysql+aiomysql://"):
    URL_BASE_DATOS = URL_BASE_DATOS.replace("mysql+aiomysql://", "mysql+pymysql://")
elif URL_BASE_DATOS.startswith("mysql://"):
    URL_BASE_DATOS = URL_BASE_DATOS.replace("mysql://", "mysql+pymysql://")

# El parámetro echo=True te permite ver las consultas SQL en la consola (útil en desarrollo)
motor = create_engine(URL_BASE_DATOS, echo=True)

def obtener_sesion():
    """
    Dependencia de FastAPI para inyectar la sesión de la base de datos 
    en cada petición y cerrarla automáticamente al terminar.
    """
    with Session(motor) as sesion:
        yield sesion
