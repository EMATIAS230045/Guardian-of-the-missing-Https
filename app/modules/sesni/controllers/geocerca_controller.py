"""
modules/sesni/controllers/geocerca_controller.py

Capa de orquestación entre las rutas y los servicios del Módulo 4.
"""

from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.orm import Session

from app.modules.sesni.schemas.geocerca_schema import (
    DBSCANParams,
    DBSCANResponse,
    EvaluacionInput,
    EvaluacionOut,
    GeocercaInput,
    GeocercaOut,
    GeocercaUpdate,
)
from app.modules.sesni.services import dbscan_service, geocerca_service as service


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------
async def crear_geocerca_controller(
    db: AsyncIOMotorDatabase, data: GeocercaInput
) -> GeocercaOut:
    doc = await service.crear_geocerca(db, data)
    return GeocercaOut(**doc)


async def listar_geocercas_controller(
    db: AsyncIOMotorDatabase,
    id_usuario: Optional[int],
    tipo_zona: Optional[str],
    activa: Optional[bool],
) -> list[GeocercaOut]:
    docs = await service.listar_geocercas(db, id_usuario, tipo_zona, activa)
    return [GeocercaOut(**d) for d in docs]


async def obtener_geocerca_controller(
    db: AsyncIOMotorDatabase, geocerca_id: str
) -> GeocercaOut:
    try:
        doc = await service.obtener_geocerca(db, geocerca_id)
    except service.GeocercaNoEncontradaError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return GeocercaOut(**doc)


async def actualizar_geocerca_controller(
    db: AsyncIOMotorDatabase, geocerca_id: str, data: GeocercaUpdate
) -> GeocercaOut:
    try:
        doc = await service.actualizar_geocerca(db, geocerca_id, data)
    except service.GeocercaNoEncontradaError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return GeocercaOut(**doc)


async def eliminar_geocerca_controller(db: AsyncIOMotorDatabase, geocerca_id: str) -> None:
    try:
        await service.eliminar_geocerca(db, geocerca_id)
    except service.GeocercaNoEncontradaError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# Hotspots
# ---------------------------------------------------------------------------
async def obtener_hotspots_controller(db: AsyncIOMotorDatabase) -> list[GeocercaOut]:
    docs = await service.obtener_hotspots(db)
    return [GeocercaOut(**d) for d in docs]


# ---------------------------------------------------------------------------
# Evaluación de transición espacial
# ---------------------------------------------------------------------------
async def evaluar_punto_controller(
    db: AsyncIOMotorDatabase, data: EvaluacionInput
) -> EvaluacionOut:
    try:
        resultado = await service.evaluar_punto(db, data)
    except service.UbicacionRequeridaError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return EvaluacionOut(**resultado)


# ---------------------------------------------------------------------------
# DBSCAN
# ---------------------------------------------------------------------------
async def ejecutar_dbscan_controller(
    mongo_db: AsyncIOMotorDatabase,
    mysql_session: Session,
    params: DBSCANParams,
) -> DBSCANResponse:
    try:
        resultado = await dbscan_service.ejecutar_dbscan(mongo_db, mysql_session, params)
    except Exception as exc:  # noqa: BLE001 — errores de DB/clustering
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ejecutar DBSCAN: {exc}",
        ) from exc

    return DBSCANResponse(**resultado)