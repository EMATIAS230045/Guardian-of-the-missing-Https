"""
modules/sesni/models/ubicacion_model.py

Modelo de documento para la colección MongoDB 'ubicaciones'.
No se usa un ODM pesado (como Beanie) a propósito: en escenarios de escritura
de altísima frecuencia, insertar dicts planos vía Motor directamente reduce
overhead de serialización. Este módulo centraliza el mapeo dict <-> schema.

Estructura del documento en Mongo:
{
    "_id": ObjectId(...),
    "id_usuario": 152,
    "ubicacion": {"type": "Point", "coordinates": [lon, lat]},
    "precision_metros": 5.4,
    "fecha_hora": ISODate("2026-07-27T10:15:30Z"),
    "modo": "normal",
    "dispositivo": "mobile"   # opcional, presente en batches de smartwatch
}
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional


class UbicacionModel:
    """Helpers estáticos de construcción/serialización del documento Mongo."""

    @staticmethod
    def to_document(
        id_usuario: int,
        coordinates: list[float],
        fecha_hora: datetime,
        precision_metros: Optional[float] = None,
        modo: str = "normal",
        dispositivo: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Construye el dict listo para insert_one / insert_many."""
        doc: Dict[str, Any] = {
            "id_usuario": id_usuario,
            "ubicacion": {"type": "Point", "coordinates": coordinates},
            "precision_metros": precision_metros,
            "fecha_hora": fecha_hora,
            "modo": modo,
        }
        if dispositivo:
            doc["dispositivo"] = dispositivo
        return doc

    @staticmethod
    def from_document(doc: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convierte un documento crudo de Mongo (con _id de tipo ObjectId) en un
        dict serializable, listo para validarse contra UbicacionOut.
        """
        return {
            "id_usuario": doc["id_usuario"],
            "ubicacion": doc["ubicacion"],
            "precision_metros": doc.get("precision_metros"),
            "fecha_hora": doc["fecha_hora"],
            "modo": doc.get("modo"),
        }