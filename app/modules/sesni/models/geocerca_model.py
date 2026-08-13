"""
modules/sesni/models/geocerca_model.py

Modelo de documento para la colección MongoDB 'geocercas'.

Estructura del documento:
{
    "_id": ObjectId(...),
    "id_usuario": 152 | None,          # None en zonas de riesgo auto-generadas
    "nombre": "Casa",
    "tipo_zona": "segura" | "riesgo",
    "ubicacion": {"type": "Point", "coordinates": [lon, lat]},
    "radio_metros": 150.0,
    "activa": True,
    "fecha_creacion": ISODate(...),
    "origen": "manual" | "dbscan",
    "total_incidentes": 8              # solo presente si origen == "dbscan"
}
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional


class GeocercaModel:
    """Helpers estáticos de construcción/serialización del documento Mongo."""

    @staticmethod
    def to_document(
        nombre: str,
        tipo_zona: str,
        coordinates: list[float],
        radio_metros: float,
        id_usuario: Optional[int] = None,
        activa: bool = True,
        origen: str = "manual",
        total_incidentes: Optional[int] = None,
        fecha_creacion: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        doc: Dict[str, Any] = {
            "id_usuario": id_usuario,
            "nombre": nombre,
            "tipo_zona": tipo_zona,
            "ubicacion": {"type": "Point", "coordinates": coordinates},
            "radio_metros": radio_metros,
            "activa": activa,
            "fecha_creacion": fecha_creacion or datetime.now(timezone.utc),
            "origen": origen,
        }
        if total_incidentes is not None:
            doc["total_incidentes"] = total_incidentes
        return doc

    @staticmethod
    def from_document(doc: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": str(doc["_id"]),
            "id_usuario": doc.get("id_usuario"),
            "nombre": doc["nombre"],
            "tipo_zona": doc["tipo_zona"],
            "ubicacion": doc["ubicacion"],
            "radio_metros": doc["radio_metros"],
            "activa": doc["activa"],
            "fecha_creacion": doc["fecha_creacion"],
            "origen": doc.get("origen", "manual"),
            "total_incidentes": doc.get("total_incidentes"),
        }