import os
import ssl
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

# Carga las variables del archivo .env
load_dotenv() 

# 1. Obtener la URL (priorizar DATABASE_URL que usa Render)
MYSQL_URL = os.getenv("MYSQL_URL") or os.getenv("DATABASE_URL")

if not MYSQL_URL:
    raise ValueError("¡Error! Debes definir MYSQL_URL o DATABASE_URL en tu archivo .env")

# 2. Asegurar que usamos el driver asíncrono aiomysql
if MYSQL_URL.startswith("mysql+pymysql://"):
    MYSQL_URL = MYSQL_URL.replace("mysql+pymysql://", "mysql+aiomysql://")
elif MYSQL_URL.startswith("mysql://"):
    MYSQL_URL = MYSQL_URL.replace("mysql://", "mysql+aiomysql://")

# 3. Configurar contexto SSL requerido por TiDB Cloud Serverless
ssl_context = ssl.create_default_context()

# 4. Crear el motor asíncrono
engine = create_async_engine(
    MYSQL_URL,
    echo=False,
    connect_args={"ssl": ssl_context},
    pool_pre_ping=True,
    pool_recycle=3600
)

# 5. Creador de sesiones asíncronas
SessionLocal = async_sessionmaker(
    bind=engine, 
    class_=AsyncSession,
    expire_on_commit=False
)

# 6. Clase base para modelos (aunque se recomienda usar la de app.database.models)
Base = declarative_base()

# 7. Dependencia asíncrona para inyectar en las rutas de FastAPI
async def get_async_db():
    async with SessionLocal() as db:
        yield db