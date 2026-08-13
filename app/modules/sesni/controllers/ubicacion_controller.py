"""
modules/sesni/controllers/ubicacion_controller.py

Capa de orquestación entre las rutas (routes) y los servicios (services).
Traduce excepciones de negocio en respuestas HTTP coherentes.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.sesni.schemas.ubicacion_schema import (
    IngestaBatchResponse,
    IngestaResponse,
    TelemetriaBatchInput,
    TelemetriaInput,
    TrayectoriaOut,
    UbicacionOut,
)
from app.modules.sesni.services import ubicacion_service as service


async def ingestar_coordenada_controller(
    db: AsyncIOMotorDatabase, data: TelemetriaInput
) -> IngestaResponse:
    try:
        resultado = await service.ingestar_coordenada(db, data)
    except Exception as exc:  # noqa: BLE001 — se acota a errores de escritura Mongo
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ingestar la coordenada: {exc}",
        ) from exc

    return IngestaResponse(
        mensaje="Coordenada registrada correctamente",
        id_registro=resultado["id_registro"],
        timestamp_servidor=resultado["timestamp_servidor"],
    )


async def ingestar_batch_controller(
    db: AsyncIOMotorDatabase, data: TelemetriaBatchInput
) -> IngestaBatchResponse:
    try:
        resultado = await service.ingestar_batch(db, data)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ingestar la ráfaga de telemetría: {exc}",
        ) from exc

    return IngestaBatchResponse(
        mensaje="Ráfaga de telemetría registrada correctamente",
        ids_registrados=resultado["ids_registrados"],
        total_insertados=resultado["total_insertados"],
        timestamp_servidor=resultado["timestamp_servidor"],
    )


async def obtener_ultima_ubicacion_controller(
    db: AsyncIOMotorDatabase, id_usuario: int
) -> UbicacionOut:
    try:
        doc = await service.obtener_ultima_ubicacion(db, id_usuario)
    except service.UbicacionNoEncontradaError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc

    return UbicacionOut(**doc)


async def obtener_historial_controller(
    db: AsyncIOMotorDatabase,
    id_usuario: int,
    fecha_inicio: Optional[datetime],
    fecha_fin: Optional[datetime],
) -> TrayectoriaOut:
    if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="fecha_inicio no puede ser posterior a fecha_fin",
        )

    puntos = await service.obtener_historial(db, id_usuario, fecha_inicio, fecha_fin)

    return TrayectoriaOut(
        id_usuario=id_usuario,
        total_puntos=len(puntos),
        puntos=[UbicacionOut(**p) for p in puntos],
    )


async def buscar_cercanas_controller(
    db: AsyncIOMotorDatabase,
    longitud: float,
    latitud: float,
    radio_metros: float,
) -> list[UbicacionOut]:
    if not (-180.0 <= longitud <= 180.0) or not (-90.0 <= latitud <= 90.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coordenadas fuera de rango válido",
        )

    puntos = await service.buscar_ubicaciones_cercanas(
        db, longitud, latitud, radio_metros
    )
    return [UbicacionOut(**p) for p in puntos]