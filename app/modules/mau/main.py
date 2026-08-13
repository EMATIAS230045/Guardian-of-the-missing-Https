from fastapi import FastAPI
from contextlib import asynccontextmanager
from sqlmodel import SQLModel
from app.modules.mau.database import motor
from app.modules.mau.routes import auth_routes, user_routes
from app.modules.mau.routes import contactosEmergencia_routes

# Configuramos el ciclo de vida de la app para crear las tablas de la BD al iniciar
@asynccontextmanager
async def ciclo_de_vida(app: FastAPI):
    # Esto crea las tablas en la base de datos si no existen
    SQLModel.metadata.create_all(motor)
    yield
    # Aquí podrías agregar lógica para cuando se apague el servidor

# Instancia principal de FastAPI
app = FastAPI(
    title="Módulo IAM - GuardianWater",
    description="API para la gestión de identidad y acceso del sistema",
    version="1.0.0",
    lifespan=ciclo_de_vida
)

# ==========================================
# INCLUSIÓN DE RUTAS
# ==========================================

# Conectamos el router de autenticación a la app principal
app.include_router(auth_routes.router)
    
# Conectamos el router de gestión de usuarios a la app principal
app.include_router(user_routes.router)
app.include_router(contactosEmergencia_routes.router)

# Ruta raíz de comprobación
@app.get("/", tags=["Estado"])
def estado_servidor():
    return {"mensaje": "El servidor del Módulo IAM está en línea y funcionando."}
