"""
modules/sesni/routes/geocerca_routes.py

Endpoints del Módulo 4: Análisis Geoespacial y Geocercas Inteligentes.

NOTA sobre MySQL:
El endpoint de DBSCAN necesita una sesión de MySQL (lectura de la tabla
Alertas). Se deja un stub `get_mysql_session` — reemplázalo por la
dependencia real de tu proyecto, por ejemplo:
    from app.config.config import get_db as get_mysql_session

NOTA sobre autenticación:
Igual que en el Módulo 3, se reutiliza un stub `verify_token`. Sustitúyelo
por la dependencia real del Módulo IAM.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.orm import Session

from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.mati.services.mysql.mysql import get_db as get_mysql_session
from app.modules.mati.services.mongo_config import get_database
from app.modules.mati.services.orquestador.orquestador_alertas import evaluar_y_procesar_alerta
from app.modules.mati.controllers import geocerca_controller as controller
from app.modules.mati.schemas.geocerca_schema import (
    DBSCANParams,
    DBSCANResponse,
    EvaluacionInput,
    EvaluacionOut,
    GeocercaInput,
    GeocercaOut,
    GeocercaUpdate,
)

router = APIRouter(prefix="/geocercas", tags=["Spatial Analytics"])


# ---------------------------------------------------------------------------
# Dependencias placeholder — sustituir por las reales del proyecto
# ---------------------------------------------------------------------------
async def verify_token() -> dict:
    """Placeholder de validación JWT (Módulo IAM)."""
    return {"sub": "placeholder-user"}


# ---------------------------------------------------------------------------
# CRUD de geocercas manuales
# ---------------------------------------------------------------------------
@router.post(
    "/",
    response_model=GeocercaOut,
    status_code=status.HTTP_201_CREATED,
    summary="Definir una geocerca manual (segura o de riesgo)",
)
async def crear_geocerca(
    data: GeocercaInput,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _usuario_token: dict = Depends(verify_token),
):
    return await controller.crear_geocerca_controller(db, data)


@router.get(
    "/",
    response_model=list[GeocercaOut],
    summary="Listar geocercas, con filtros opcionales",
)
async def listar_geocercas(
    id_usuario: Optional[int] = Query(default=None),
    tipo_zona: Optional[str] = Query(default=None, pattern="^(segura|riesgo)$"),
    activa: Optional[bool] = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _usuario_token: dict = Depends(verify_token),
):
    return await controller.listar_geocercas_controller(db, id_usuario, tipo_zona, activa)


@router.get(
    "/{geocerca_id}",
    response_model=GeocercaOut,
    summary="Obtener el detalle de una geocerca",
)
async def obtener_geocerca(
    geocerca_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _usuario_token: dict = Depends(verify_token),
):
    return await controller.obtener_geocerca_controller(db, geocerca_id)


@router.put(
    "/{geocerca_id}",
    response_model=GeocercaOut,
    summary="Actualizar una geocerca existente",
)
async def actualizar_geocerca(
    geocerca_id: str,
    data: GeocercaUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _usuario_token: dict = Depends(verify_token),
):
    return await controller.actualizar_geocerca_controller(db, geocerca_id, data)


@router.delete(
    "/{geocerca_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una geocerca",
)
async def eliminar_geocerca(
    geocerca_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _usuario_token: dict = Depends(verify_token),
):
    await controller.eliminar_geocerca_controller(db, geocerca_id)


# ---------------------------------------------------------------------------
# Hotspots activos (mapas de calor)
# ---------------------------------------------------------------------------
@router.get(
    "/analytics/hotspots",
    response_model=list[GeocercaOut],
    summary="Obtener las zonas de riesgo activas para el mapa de calor",
)
async def obtener_hotspots(
    db: AsyncIOMotorDatabase = Depends(get_database),
    _usuario_token: dict = Depends(verify_token),
):
    return await controller.obtener_hotspots_controller(db)


# ---------------------------------------------------------------------------
# Evaluación de transición espacial (breach / proximity)
# ---------------------------------------------------------------------------
@router.post(
    "/evaluar",
    response_model=EvaluacionOut,
    summary="Evaluar si un usuario viola o se aproxima a una geocerca",
)
async def evaluar_punto(
    data: EvaluacionInput,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _usuario_token: dict = Depends(verify_token),
):
    return await controller.evaluar_punto_controller(db, data)


# ---------------------------------------------------------------------------
# Ejecución de DBSCAN (batch / cron job)
# ---------------------------------------------------------------------------
@router.post(
    "/dbscan/ejecutar",
    response_model=DBSCANResponse,
    summary="Ejecutar clustering DBSCAN sobre el histórico de Alertas y regenerar zonas de riesgo",
)
async def ejecutar_dbscan(
    params: DBSCANParams = DBSCANParams(),
    mongo_db: AsyncIOMotorDatabase = Depends(get_database),
    mysql_session: AsyncSession = Depends(get_mysql_session),
    _usuario_token: dict = Depends(verify_token),
):
    return await controller.ejecutar_dbscan_controller(mongo_db, mysql_session, params)

# ---------------------------------------------------------------------------
# NUEVO ENDPOINT: Evaluación Geoespacial + Generación de Alerta en MySQL
# ---------------------------------------------------------------------------
@router.post(
    "/evaluar-con-alerta",
    summary="Evalúa la geocerca y genera automáticamente el registro en MySQL si ocurre un breach",
    status_code=status.HTTP_200_OK,
)
async def evaluar_punto_y_alertar(
    data: EvaluacionInput,
    mongo_db: AsyncIOMotorDatabase = Depends(get_database),
    mysql_db: AsyncSession = Depends(get_mysql_session),
    _usuario_token: dict = Depends(verify_token),
):
    """
    Ejecuta el orquestador: 
    1. Verifica brechas de geocerca en MongoDB.
    2. Si 'evento' == 'breach_detected', persiste la alerta con id_geocerca_mongo en MySQL.
    """
    return await evaluar_y_procesar_alerta(mongo_db, mysql_db, data)