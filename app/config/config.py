import os

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# 1. Intentar usar la variable global DATABASE_URL de Render
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Si no existe DATABASE_URL, construirla desde variables individuales (entorno local)
if not DATABASE_URL:
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "1234")
    MYSQL_DB = os.getenv("MYSQL_DB", "guardian")
    DATABASE_URL = (
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@"
        f"{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    )

# 3. Configurar SSL a través de connect_args si la conexión es hacia TiDB Cloud
connect_args = {}
if "tidbcloud.com" in DATABASE_URL:
    connect_args = {"ssl": {"ca": None}}

# pool_pre_ping evita errores por conexiones muertas tras inactividad
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    """
    Dependency injectable en las rutas de FastAPI.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()