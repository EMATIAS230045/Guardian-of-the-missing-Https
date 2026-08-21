import os
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient

from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from bson.objectid import ObjectId
from typing import Optional

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "guardian_of_the_missing"

client = AsyncIOMotorClient(MONGO_URI)
db_mongo = client[DB_NAME]
fs_bucket: Optional[AsyncIOMotorGridFSBucket] = None


def _get_fs_bucket() -> AsyncIOMotorGridFSBucket:
    global fs_bucket
    if fs_bucket is None:
        fs_bucket = AsyncIOMotorGridFSBucket(db_mongo)
    return fs_bucket

# --- HISTORIAL DE UBICACIONES ---
async def guardar_ubicacion_gps(id_usuario: int, lat: float, lon: float, precision: Optional[float] = None) -> str:
    """Inserta una coordenada en la colección 'ubicaciones'."""
    doc = {
        "id_usuario": id_usuario,
        "ubicacion": {
            "type": "Point",
            "coordinates": [lon, lat]  # GeoJSON: [longitud, latitud]
        },
        "precision_metros": precision,
        "fecha_hora": datetime.now(timezone.utc)
    }
    result = await db_mongo.ubicaciones.insert_one(doc)
    return str(result.inserted_id)


# --- GEOCERCAS ---
async def crear_geocerca(id_usuario: int, nombre: str, tipo_zona: str, lat: float, lon: float, radio_metros: float, activa: bool = True) -> str:
    """Crea un documento de geocerca en la colección 'geocercas'."""
    doc = {
        "id_usuario": id_usuario,
        "nombre": nombre,
        "tipo_zona": tipo_zona,
        "ubicacion": {
            "type": "Point",
            "coordinates": [lon, lat]  # GeoJSON: [longitud, latitud]
        },
        "radio_metros": radio_metros,
        "activa": activa,
        "fecha_creacion": datetime.now(timezone.utc)
    }
    result = await db_mongo.geocercas.insert_one(doc)
    return str(result.inserted_id)


async def probar_busqueda_geocerca(id_usuario: int, lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """Busca si el punto (lat, lon) cae dentro de alguna geocerca del usuario."""
    pipeline = [
        {
            "$geoNear": {
                "near": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                },
                "distanceField": "distancia_calculada",
                "spherical": True,
                "query": {
                    "id_usuario": id_usuario,
                    "activa": True
                }
            }
        },
        {
            "$match": {
                "$expr": {"$lte": ["$distancia_calculada", "$radio_metros"]}
            }
        },
        {"$limit": 1}
    ]

    cursor = db_mongo.geocercas.aggregate(pipeline)
    geocercas = await cursor.to_list(length=1)

    if geocercas:
        geocerca = geocercas[0]
        geocerca["_id"] = str(geocerca["_id"])  # Convertir ObjectId a String para FastAPI
        return geocerca
    return None

async def crear_indices_mongo():
    """Crea los índices geoespaciales y de búsqueda si aún no existen en Mongo."""
    # Índice 2dsphere indispensable para $geoNear en geocercas
    await db_mongo.geocercas.create_index([("ubicacion", "2dsphere")])
    await db_mongo.geocercas.create_index([("id_usuario", 1)])

    # Índices para el historial de ubicaciones
    await db_mongo.ubicaciones.create_index([("ubicacion", "2dsphere")])
    await db_mongo.ubicaciones.create_index([("id_usuario", 1), ("fecha_hora", -1)])
    
    print("Índices geoespaciales de Mongo creados/verificados correctamente.")

async def guardar_audio_gridfs(id_usuario: int, file_bytes: bytes, filename: str, content_type: str) -> str:
    """Guarda un archivo de audio en fragmentos (chunks) dentro de GridFS."""
    grid_in = _get_fs_bucket().open_upload_stream(
        filename,
        metadata={
            "id_usuario": id_usuario,
            "content_type": content_type
        }
    )
    await grid_in.write(file_bytes)
    await grid_in.close()
    return str(grid_in._id)

async def obtener_stream_audio_gridfs(file_id: str):
    """Abre un stream de descarga desde GridFS dado un ID único de archivo."""
    try:
        object_id = ObjectId(file_id)
        grid_out = await _get_fs_bucket().open_download_stream(object_id)
        return grid_out
    except Exception:
        return None
