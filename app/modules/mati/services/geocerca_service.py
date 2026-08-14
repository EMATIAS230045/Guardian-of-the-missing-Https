"""
modules/sesni/services/geocerca_service.py

Lógica de negocio para geocercas manuales (CRUD), evaluación de transiciones
espaciales (breach / proximity) y consulta de hotspots activos.

El cálculo de distancias usa la fórmula de Haversine directamente en Python
(sin dependencias geoespaciales pesadas) para evaluar proximidad puntual;
las búsquedas masivas por cercanía usan el índice 2dsphere vía $near.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.modules.mati.services.mongo_config import COLLECTION_GEOCERCAS, COLLECTION_UBICACIONES
from app.modules.sesni.models.geocerca_model import GeocercaModel
from app.modules.mati.schemas.geocerca_schema import (
    EvaluacionInput,
    GeocercaInput,
    GeocercaUpdate,
    TipoEvento,
)

RADIO_TIERRA_METROS = 6_371_000


class GeocercaNoEncontradaError(Exception):
    pass


class UbicacionRequeridaError(Exception):
    """El usuario no tiene ubicaciones registradas y no se envió una manualmente."""


# ---------------------------------------------------------------------------
# Utilidad: distancia Haversine entre dos puntos [lon, lat]
# ---------------------------------------------------------------------------
def haversine_metros(coord_a: list[float], coord_b: list[float]) -> float:
    lon1, lat1 = map(math.radians, coord_a)
    lon2, lat2 = map(math.radians, coord_b)

    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return RADIO_TIERRA_METROS * c


def _validar_object_id(geocerca_id: str) -> ObjectId:
    try:
        return ObjectId(geocerca_id)
    except InvalidId as exc:
        raise GeocercaNoEncontradaError(f"id de geocerca inválido: {geocerca_id}") from exc


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------
async def crear_geocerca(db: AsyncIOMotorDatabase, data: GeocercaInput) -> dict:
    coleccion = db[COLLECTION_GEOCERCAS]

    documento = GeocercaModel.to_document(
        nombre=data.nombre,
        tipo_zona=data.tipo_zona.value,
        coordinates=data.ubicacion.coordinates,
        radio_metros=data.radio_metros,
        id_usuario=data.id_usuario,
        activa=data.activa,
        origen="manual",
    )

    resultado = await coleccion.insert_one(documento)
    documento["_id"] = resultado.inserted_id
    return GeocercaModel.from_document(documento)


async def listar_geocercas(
    db: AsyncIOMotorDatabase,
    id_usuario: Optional[int] = None,
    tipo_zona: Optional[str] = None,
    activa: Optional[bool] = None,
) -> list[dict]:
    coleccion = db[COLLECTION_GEOCERCAS]

    filtro: dict = {}
    if id_usuario is not None:
        filtro["id_usuario"] = id_usuario
    if tipo_zona is not None:
        filtro["tipo_zona"] = tipo_zona
    if activa is not None:
        filtro["activa"] = activa

    cursor = coleccion.find(filtro).sort("fecha_creacion", -1)
    return [GeocercaModel.from_document(doc) async for doc in cursor]


async def obtener_geocerca(db: AsyncIOMotorDatabase, geocerca_id: str) -> dict:
    coleccion = db[COLLECTION_GEOCERCAS]
    _id = _validar_object_id(geocerca_id)

    doc = await coleccion.find_one({"_id": _id})
    if doc is None:
        raise GeocercaNoEncontradaError(f"No existe geocerca con id={geocerca_id}")

    return GeocercaModel.from_document(doc)


async def actualizar_geocerca(
    db: AsyncIOMotorDatabase, geocerca_id: str, data: GeocercaUpdate
) -> dict:
    coleccion = db[COLLECTION_GEOCERCAS]
    _id = _validar_object_id(geocerca_id)

    cambios: dict = {}
    if data.nombre is not None:
        cambios["nombre"] = data.nombre
    if data.ubicacion is not None:
        cambios["ubicacion"] = {
            "type": "Point",
            "coordinates": data.ubicacion.coordinates,
        }
    if data.radio_metros is not None:
        cambios["radio_metros"] = data.radio_metros
    if data.activa is not None:
        cambios["activa"] = data.activa

    if not cambios:
        return await obtener_geocerca(db, geocerca_id)

    resultado = await coleccion.find_one_and_update(
        {"_id": _id}, {"$set": cambios}, return_document=True
    )
    if resultado is None:
        raise GeocercaNoEncontradaError(f"No existe geocerca con id={geocerca_id}")

    return GeocercaModel.from_document(resultado)


async def eliminar_geocerca(db: AsyncIOMotorDatabase, geocerca_id: str) -> None:
    coleccion = db[COLLECTION_GEOCERCAS]
    _id = _validar_object_id(geocerca_id)

    resultado = await coleccion.delete_one({"_id": _id})
    if resultado.deleted_count == 0:
        raise GeocercaNoEncontradaError(f"No existe geocerca con id={geocerca_id}")


# ---------------------------------------------------------------------------
# Hotspots activos (para mapas de calor / dashboard)
# ---------------------------------------------------------------------------
async def obtener_hotspots(db: AsyncIOMotorDatabase) -> list[dict]:
    coleccion = db[COLLECTION_GEOCERCAS]
    cursor = coleccion.find({"tipo_zona": "riesgo", "activa": True})
    return [GeocercaModel.from_document(doc) async for doc in cursor]


# ---------------------------------------------------------------------------
# Evaluación Point-in-Polygon / Proximity
# ---------------------------------------------------------------------------
async def evaluar_punto(db: AsyncIOMotorDatabase, data: EvaluacionInput) -> dict:
    # 1. Resolver la coordenada a evaluar
    if data.ubicacion is not None:
        coordenadas = data.ubicacion.coordinates
    else:
        ultima = await db[COLLECTION_UBICACIONES].find_one(
            {"id_usuario": data.id_usuario}, sort=[("fecha_hora", -1)]
        )
        if ultima is None:
            raise UbicacionRequeridaError(
                f"id_usuario={data.id_usuario} no tiene ubicaciones registradas "
                "y no se envió una coordenada manual."
            )
        coordenadas = ultima["ubicacion"]["coordinates"]

    # 2. Candidatas cercanas usando el índice 2dsphere (evita escanear toda
    #    la colección): trae geocercas dentro de un radio amplio de búsqueda.
    radio_busqueda = 20_000  # metros — techo razonable para zonas urbanas
    coleccion = db[COLLECTION_GEOCERCAS]
    cursor = coleccion.find(
        {
            "activa": True,
            "ubicacion": {
                "$near": {
                    "$geometry": {"type": "Point", "coordinates": coordenadas},
                    "$maxDistance": radio_busqueda,
                }
            },
        }
    )
    candidatas = [doc async for doc in cursor]

    evento = TipoEvento.SIN_EVENTO
    afectadas: list[dict] = []

    for doc in candidatas:
        distancia = haversine_metros(coordenadas, doc["ubicacion"]["coordinates"])
        pertenece_al_usuario = doc.get("id_usuario") in (None, data.id_usuario)

        if doc["tipo_zona"] == "riesgo":
            if distancia <= doc["radio_metros"]:
                evento = TipoEvento.BREACH_DETECTED
                afectadas.append(
                    {"id": str(doc["_id"]), "nombre": doc["nombre"],
                     "tipo_zona": doc["tipo_zona"], "distancia_metros": round(distancia, 2)}
                )
            elif distancia <= doc["radio_metros"] + data.radio_proximidad_metros:
                if evento != TipoEvento.BREACH_DETECTED:
                    evento = TipoEvento.PROXIMITY_WARNING
                afectadas.append(
                    {"id": str(doc["_id"]), "nombre": doc["nombre"],
                     "tipo_zona": doc["tipo_zona"], "distancia_metros": round(distancia, 2)}
                )

        elif doc["tipo_zona"] == "segura" and pertenece_al_usuario:
            # Violación = el usuario está FUERA de su zona segura.
            if distancia > doc["radio_metros"]:
                evento = TipoEvento.BREACH_DETECTED
                afectadas.append(
                    {"id": str(doc["_id"]), "nombre": doc["nombre"],
                     "tipo_zona": doc["tipo_zona"], "distancia_metros": round(distancia, 2)}
                )

    return {
        "id_usuario": data.id_usuario,
        "evento": evento,
        "geocercas_afectadas": afectadas,
        "evaluado_en": datetime.now(timezone.utc),
    }