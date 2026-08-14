"""
config/config.py

Configuración de conexión a MySQL (hospital_230892) usando SQLAlchemy en
modo SÍNCRONO con el driver PyMySQL.

Por qué síncrono y no async:
- PyMySQL es 100% Python puro (sin extensiones C), lo que evita los problemas
  de compatibilidad de wheels en Windows + Python 3.14 que ya se presentaron
  en otros proyectos.
- Los drivers async de MySQL (aiomysql, asyncmy) dependen de extensiones C
  que tardan en publicar soporte para versiones nuevas de Python.
- FastAPI ejecuta automáticamente las dependencias síncronas (def, no async
  def) en un threadpool, así que no bloquea el event loop aunque la sesión
  en sí no sea async.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# ---------------------------------------------------------------------------
# Variables de entorno (ajustar según tu .env / entorno local)
# ---------------------------------------------------------------------------
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "1234")
MYSQL_DB = os.getenv("MYSQL_DB", "guardian")

DATABASE_URL = (
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@"
    f"{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?ssl_mode=VERIFY_IDENTITY"
)

# pool_pre_ping evita errores por conexiones muertas tras inactividad
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    """
    Dependency injectable en las rutas de FastAPI:
        db: Session = Depends(get_db)
    Al ser una función síncrona (def, no async def), FastAPI la corre en un
    threadpool automáticamente cuando se usa dentro de un endpoint async.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()