"""
modules/sesni/services/ubicacion_service.py

Lógica de negocio del Módulo 3 (GPS Telemetry).
Toda operación es asíncrona (Motor) para no bloquear el event loop durante
las escrituras de alta frecuencia provenientes de GPS/smartwatch.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config.mongo_config import COLLECTION_UBICACIONES
from app.modules.sesni.models.ubicacion_model import UbicacionModel
from app.modules.sesni.schemas.ubicacion_schema import (
    TelemetriaBatchInput,
    TelemetriaInput,
)


class UbicacionNoEncontradaError(Exception):
    """El usuario no tiene ubicaciones registradas."""


# ---------------------------------------------------------------------------
# 1. Ingestar coordenada (individual, alta frecuencia)
# ---------------------------------------------------------------------------
async def ingestar_coordenada(
    db: AsyncIOMotorDatabase, data: TelemetriaInput
) -> dict:
    coleccion = db[COLLECTION_UBICACIONES]

    documento = UbicacionModel.to_document(
        id_usuario=data.id_usuario,
        coordinates=data.ubicacion.coordinates,
        fecha_hora=data.fecha_hora,
        precision_metros=data.precision_metros,
        modo=data.modo.value,
        dispositivo="mobile",
    )

    resultado = await coleccion.insert_one(documento)

    return {
        "id_registro": str(resultado.inserted_id),
        "timestamp_servidor": datetime.utcnow(),
    }


# ---------------------------------------------------------------------------
# 2. Ingesta por ráfaga (batch) — smartwatches
# ---------------------------------------------------------------------------
async def ingestar_batch(db: AsyncIOMotorDatabase, data: TelemetriaBatchInput) -> dict:
    coleccion = db[COLLECTION_UBICACIONES]

    documentos = [
        UbicacionModel.to_document(
            id_usuario=data.id_usuario,
            coordinates=punto.ubicacion.coordinates,
            fecha_hora=punto.fecha_hora,
            precision_metros=punto.precision_metros,
            modo="normal",
            dispositivo=data.dispositivo,
        )
        for punto in data.puntos
    ]

    # insert_many con ordered=False: si un punto individual falla la validación
    # a nivel Mongo, no bloquea la inserción del resto de la ráfaga.
    resultado = await coleccion.insert_many(documentos, ordered=False)

    return {
        "ids_registrados": [str(_id) for _id in resultado.inserted_ids],
        "total_insertados": len(resultado.inserted_ids),
        "timestamp_servidor": datetime.utcnow(),
    }


# ---------------------------------------------------------------------------
# 3. Obtener última ubicación
# ---------------------------------------------------------------------------
async def obtener_ultima_ubicacion(
    db: AsyncIOMotorDatabase, id_usuario: int
) -> dict:
    coleccion = db[COLLECTION_UBICACIONES]

    # Usa el índice compuesto (id_usuario, fecha_hora DESC) — evita COLLSCAN.
    doc = await coleccion.find_one(
        {"id_usuario": id_usuario}, sort=[("fecha_hora", -1)]
    )

    if doc is None:
        raise UbicacionNoEncontradaError(
            f"No existen ubicaciones registradas para id_usuario={id_usuario}"
        )

    return UbicacionModel.from_document(doc)


# ---------------------------------------------------------------------------
# 4. Recuperar historial de trayectorias
# ---------------------------------------------------------------------------
async def obtener_historial(
    db: AsyncIOMotorDatabase,
    id_usuario: int,
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None,
    limite: int = 1000,
) -> list[dict]:
    coleccion = db[COLLECTION_UBICACIONES]

    filtro: dict = {"id_usuario": id_usuario}
    rango_fecha: dict = {}
    if fecha_inicio:
        rango_fecha["$gte"] = fecha_inicio
    if fecha_fin:
        rango_fecha["$lte"] = fecha_fin
    if rango_fecha:
        filtro["fecha_hora"] = rango_fecha

    cursor = coleccion.find(filtro).sort("fecha_hora", 1).limit(limite)

    return [UbicacionModel.from_document(doc) async for doc in cursor]


# ---------------------------------------------------------------------------
# 5. Bonus: búsqueda geoespacial de puntos cercanos ($near)
#    Justifica el uso del índice 2dsphere de forma directa.
# ---------------------------------------------------------------------------
async def buscar_ubicaciones_cercanas(
    db: AsyncIOMotorDatabase,
    longitud: float,
    latitud: float,
    radio_metros: float = 500,
    limite: int = 100,
) -> list[dict]:
    coleccion = db[COLLECTION_UBICACIONES]

    filtro = {
        "ubicacion": {
            "$near": {
                "$geometry": {"type": "Point", "coordinates": [longitud, latitud]},
                "$maxDistance": radio_metros,
            }
        }
    }

    cursor = coleccion.find(filtro).limit(limite)
    return [UbicacionModel.from_document(doc) async for doc in cursor]