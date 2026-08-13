"""
config/mongo_config.py

Configuración de conexión a MongoDB para el Módulo 3 (GPS Telemetry).
Usa Motor (driver asíncrono oficial de MongoDB para Python) para no bloquear
el event loop de FastAPI durante escrituras de alta frecuencia.

Justificación arquitectónica:
- Se aísla completamente de config.py (MySQL) para separar la infraestructura
  transaccional (MySQL) de la infraestructura de ingesta masiva (MongoDB).
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

# ---------------------------------------------------------------------------
# Variables de entorno (ajustar según tu .env / docker-compose)
# ---------------------------------------------------------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "hospital_230892_geo")

COLLECTION_UBICACIONES = "ubicaciones"
COLLECTION_GEOCERCAS = "geocercas"

# ---------------------------------------------------------------------------
# Cliente global (singleton) — se instancia una sola vez en el ciclo de vida
# de la aplicación (ver evento startup en main.py)
# ---------------------------------------------------------------------------
_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def connect_to_mongo() -> None:
    """Inicializa el cliente de Motor. Llamar en el evento startup de FastAPI."""
    global _client, _db
    _client = AsyncIOMotorClient(MONGO_URI, uuidRepresentation="standard")
    _db = _client[MONGO_DB_NAME]


def close_mongo_connection() -> None:
    """Cierra el cliente de Motor. Llamar en el evento shutdown de FastAPI."""
    global _client
    if _client is not None:
        _client.close()


def get_database() -> AsyncIOMotorDatabase:
    """
    Dependency injectable en las rutas de FastAPI:
        db: AsyncIOMotorDatabase = Depends(get_database)
    """
    if _db is None:
        raise RuntimeError(
            "MongoDB no ha sido inicializado. Verifica que connect_to_mongo() "
            "se ejecute en el evento startup de la aplicación."
        )
    return _db


async def ensure_indexes() -> None:
    """
    Crea los índices necesarios en la colección 'ubicaciones'.
    - 2dsphere sobre 'ubicacion': habilita consultas espaciales ($near, $geoWithin).
    - Compuesto (id_usuario, fecha_hora): optimiza 'última ubicación' e 'historial'.
    Llamar en el evento startup, después de connect_to_mongo().
    """
    db = get_database()
    coleccion = db[COLLECTION_UBICACIONES]

    await coleccion.create_index([("ubicacion", "2dsphere")], name="idx_geo_2dsphere")
    await coleccion.create_index(
        [("id_usuario", 1), ("fecha_hora", -1)], name="idx_usuario_fecha"
    )

    # --- Módulo 4: geocercas -------------------------------------------
    geocercas = db[COLLECTION_GEOCERCAS]
    await geocercas.create_index([("ubicacion", "2dsphere")], name="idx_geocerca_2dsphere")
    await geocercas.create_index(
        [("tipo_zona", 1), ("activa", 1)], name="idx_tipo_zona_activa"
    )
    await geocercas.create_index([("id_usuario", 1)], name="idx_geocerca_usuario")