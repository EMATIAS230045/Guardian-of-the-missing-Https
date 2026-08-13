"""
modules/sesni/services/dbscan_service.py

Ejecuta el algoritmo DBSCAN (Density-Based Spatial Clustering) sobre el
histórico de la tabla `Alertas` (MySQL) para generar automáticamente
geocercas de tipo 'riesgo' en MongoDB.

Requiere: scikit-learn (pip install scikit-learn)

NOTA sobre la sesión de MySQL:
Este servicio recibe una sesión de SQLAlchemy ya abierta (AsyncSession).
Ajusta el import de `get_mysql_session` en dbscan_controller.py / routes
para que apunte a tu configuración real de MySQL (la que ya usas en tus
otros endpoints CRUD del hospital, ej. `app.config.config`).
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any

import numpy as np
from sklearn.cluster import DBSCAN
from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config.mongo_config import COLLECTION_GEOCERCAS
from app.modules.sesni.models.geocerca_model import GeocercaModel
from app.modules.sesni.schemas.geocerca_schema import DBSCANParams

RADIO_TIERRA_METROS = 6_371_000


# ---------------------------------------------------------------------------
# 1. Lectura del histórico de incidentes (MySQL, solo lectura)
# ---------------------------------------------------------------------------
def obtener_alertas_para_clustering(
    mysql_session: Session, estados_incluidos: list[str]
) -> list[dict]:
    """
    Lee id_alerta, latitud y longitud de la tabla Alertas para los estados
    indicados. Ajusta el nombre de columnas/tabla si difiere en tu esquema
    hospital_230892.

    Es una función SÍNCRONA a propósito (ver nota en config/config.py sobre
    PyMySQL). Se ejecuta fuera del event loop vía run_in_threadpool desde
    el orquestador async `ejecutar_dbscan`.
    """
    query = text(
        """
        SELECT id_alerta, latitud, longitud, fecha_hora, estado
        FROM Alertas
        WHERE estado IN :estados
          AND latitud IS NOT NULL
          AND longitud IS NOT NULL
        """
    ).bindparams(bindparam("estados", value=estados_incluidos, expanding=True))

    resultado = mysql_session.execute(query)
    filas = resultado.mappings().all()
    return [dict(fila) for fila in filas]


# ---------------------------------------------------------------------------
# 2. Clustering DBSCAN sobre coordenadas (métrica Haversine)
# ---------------------------------------------------------------------------
def _ejecutar_clustering(
    puntos: list[dict], epsilon_metros: float, min_puntos: int
) -> tuple[list[dict], int]:
    """
    Retorna (clusters, total_puntos_ruido).
    Cada cluster: {"coordinates": [lon, lat], "radio_metros": float, "total_incidentes": int}
    """
    if len(puntos) < min_puntos:
        return [], len(puntos)

    # sklearn con métrica haversine espera radianes en orden [lat, lon]
    coords_rad = np.radians(
        [[p["latitud"], p["longitud"]] for p in puntos]
    )
    eps_rad = epsilon_metros / RADIO_TIERRA_METROS

    modelo = DBSCAN(
        eps=eps_rad, min_samples=min_puntos, metric="haversine", algorithm="ball_tree"
    )
    etiquetas = modelo.fit_predict(coords_rad)

    clusters: list[dict] = []
    etiquetas_unicas = set(etiquetas) - {-1}

    for etiqueta in etiquetas_unicas:
        indices = np.where(etiquetas == etiqueta)[0]
        lats = [puntos[i]["latitud"] for i in indices]
        lons = [puntos[i]["longitud"] for i in indices]

        centroide_lat = sum(lats) / len(lats)
        centroide_lon = sum(lons) / len(lons)

        # Radio del clúster = distancia máxima del centroide a cualquier punto miembro
        radio = max(
            _haversine(centroide_lat, centroide_lon, lat, lon)
            for lat, lon in zip(lats, lons)
        )
        # Margen mínimo para que la geocerca no colapse en 0 con puntos casi idénticos
        radio = max(radio, 25.0)

        clusters.append(
            {
                "coordinates": [round(centroide_lon, 6), round(centroide_lat, 6)],
                "radio_metros": round(radio, 2),
                "total_incidentes": int(len(indices)),
            }
        )

    total_ruido = int(np.sum(etiquetas == -1))
    return clusters, total_ruido


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1, lon1, lat2, lon2 = map(math.radians, (lat1, lon1, lat2, lon2))
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return RADIO_TIERRA_METROS * 2 * math.asin(math.sqrt(a))


# ---------------------------------------------------------------------------
# 3. Persistencia: reemplaza las zonas de riesgo generadas por DBSCAN
# ---------------------------------------------------------------------------
async def _reemplazar_zonas_riesgo(
    mongo_db: AsyncIOMotorDatabase, clusters: list[dict]
) -> list[dict]:
    coleccion = mongo_db[COLLECTION_GEOCERCAS]

    # Solo se limpian las zonas auto-generadas; las geocercas manuales
    # (Casa, Escuela, etc.) nunca se tocan aquí.
    await coleccion.delete_many({"tipo_zona": "riesgo", "origen": "dbscan"})

    if not clusters:
        return []

    ahora = datetime.now(timezone.utc)
    documentos = [
        GeocercaModel.to_document(
            nombre=f"Zona de Riesgo Auto-{i + 1}",
            tipo_zona="riesgo",
            coordinates=c["coordinates"],
            radio_metros=c["radio_metros"],
            id_usuario=None,
            activa=True,
            origen="dbscan",
            total_incidentes=c["total_incidentes"],
            fecha_creacion=ahora,
        )
        for i, c in enumerate(clusters)
    ]

    resultado = await coleccion.insert_many(documentos)

    return [
        {
            "id_geocerca": str(_id),
            "centroide": {"type": "Point", "coordinates": doc["ubicacion"]["coordinates"]},
            "radio_metros": doc["radio_metros"],
            "total_incidentes": doc["total_incidentes"],
        }
        for _id, doc in zip(resultado.inserted_ids, documentos)
    ]


# ---------------------------------------------------------------------------
# 4. Orquestador público
# ---------------------------------------------------------------------------
async def ejecutar_dbscan(
    mongo_db: AsyncIOMotorDatabase,
    mysql_session: Session,
    params: DBSCANParams,
) -> dict:
    # La lectura de MySQL es síncrona (PyMySQL); se despacha a un threadpool
    # para no bloquear el event loop de FastAPI.
    puntos = await run_in_threadpool(
        obtener_alertas_para_clustering, mysql_session, params.estados_incluidos
    )

    clusters_crudos, puntos_ruido = _ejecutar_clustering(
        puntos, params.epsilon_metros, params.min_puntos
    )
    clusters_persistidos = await _reemplazar_zonas_riesgo(mongo_db, clusters_crudos)

    return {
        "mensaje": (
            f"DBSCAN ejecutado sobre {len(puntos)} alertas: "
            f"{len(clusters_persistidos)} zonas de riesgo generadas"
        ),
        "clusters_generados": len(clusters_persistidos),
        "clusters": clusters_persistidos,
        "puntos_ruido": puntos_ruido,
        "ejecutado_en": datetime.now(timezone.utc),
    }