from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from app.config.mongo_config import (
    connect_to_mongo,
    close_mongo_connection,
    ensure_indexes,
)
from app.modules.sesni.routes.ubicacion_routes import router as ubicacion_router
from app.modules.sesni.routes.geocerca_routes import router as geocerca_router
from app.modules.mau.routes.auth_routes import router as auth_router
from app.modules.mau.routes.user_routes import router as user_router
from app.modules.mau.routes.contactosEmergencia_routes import router as contactos_router
from app.modules.mati.routes.Alertas import router as alertas_router
from app.modules.mati.routes.mongo_test import router as mongo_test_router
from app.modules.mati.routes.dispositivo import router as dispositivos_router
from app.routes.ws_routes import router as ws_router

app = FastAPI(
    title="GuardianOfTheMising API",
    version="0.1.0",
    description="API base para el proyecto GuardianOfTheMising",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    message: str


@app.get("/")
def read_root() -> dict:
    return {"message": "Bienvenido a GuardianOfTheMising API"}


@app.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", message="API funcionando correctamente")


@app.on_event("startup")
async def startup():
    from app.modules.mati.services.mysql.mysql import engine
    from sqlmodel import SQLModel
    
    # Crea las tablas relacionales en MySQL/TiDB si no existen de forma asíncrona
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    connect_to_mongo()
    await ensure_indexes()


@app.on_event("shutdown")
async def shutdown():
    close_mongo_connection()


app.include_router(ubicacion_router)
app.include_router(geocerca_router)
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(contactos_router)
app.include_router(alertas_router)
app.include_router(dispositivos_router)
app.include_router(mongo_test_router)
app.include_router(ws_router)