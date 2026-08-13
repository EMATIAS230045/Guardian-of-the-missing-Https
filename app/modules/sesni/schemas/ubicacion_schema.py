"""
modules/sesni/schemas/ubicacion_schema.py

Contratos de entrada/salida del Módulo 3: Ingesta y Telemetría de Ubicación.
Todos los esquemas siguen el estándar GeoJSON (RFC 7946): coordinates = [lon, lat].
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# GeoJSON Point
# ---------------------------------------------------------------------------
class GeoJSONPoint(BaseModel):
    """
    Representación estandarizada de un punto geográfico.
    IMPORTANTE: el orden es [longitud, latitud] (estándar GeoJSON/MongoDB),
    NO [latitud, longitud].
    """

    type: str = Field(default="Point", frozen=True)
    coordinates: List[float] = Field(
        ..., min_length=2, max_length=2, examples=[[-98.0531, 20.2782]]
    )

    @field_validator("type")
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        if v != "Point":
            raise ValueError("type debe ser exactamente 'Point'")
        return v

    @field_validator("coordinates")
    @classmethod
    def validar_rango_coordenadas(cls, v: List[float]) -> List[float]:
        lon, lat = v
        if not (-180.0 <= lon <= 180.0):
            raise ValueError(f"Longitud fuera de rango [-180, 180]: {lon}")
        if not (-90.0 <= lat <= 90.0):
            raise ValueError(f"Latitud fuera de rango [-90, 90]: {lat}")
        return v

    class Config:
        json_schema_extra = {
            "example": {"type": "Point", "coordinates": [-98.0531, 20.2782]}
        }


# ---------------------------------------------------------------------------
# Modo de transmisión (adaptativo)
# ---------------------------------------------------------------------------
class ModoTransmision(str, Enum):
    NORMAL = "normal"          # 30s - 1min
    EMERGENCIA = "emergencia"  # 2s - 3s, PRIORITY_HIGH_ACCURACY


# ---------------------------------------------------------------------------
# Entrada: ingesta individual
# ---------------------------------------------------------------------------
class TelemetriaInput(BaseModel):
    id_usuario: int = Field(..., gt=0, description="Referencia lógica a MySQL")
    ubicacion: GeoJSONPoint
    precision_metros: Optional[float] = Field(default=None, ge=0)
    fecha_hora: Optional[datetime] = Field(default=None)
    modo: ModoTransmision = Field(default=ModoTransmision.NORMAL)

    @field_validator("fecha_hora")
    @classmethod
    def default_fecha_hora(cls, v: Optional[datetime]) -> datetime:
        return v or datetime.now(timezone.utc)

    class Config:
        json_schema_extra = {
            "example": {
                "id_usuario": 152,
                "ubicacion": {"type": "Point", "coordinates": [-98.0531, 20.2782]},
                "precision_metros": 5.4,
                "fecha_hora": "2026-07-27T10:15:30Z",
                "modo": "normal",
            }
        }


# ---------------------------------------------------------------------------
# Entrada: ráfaga (batch) — sincronización de smartwatches
# ---------------------------------------------------------------------------
class TelemetriaItemBatch(BaseModel):
    ubicacion: GeoJSONPoint
    precision_metros: Optional[float] = Field(default=None, ge=0)
    fecha_hora: Optional[datetime] = None

    @field_validator("fecha_hora")
    @classmethod
    def default_fecha_hora(cls, v: Optional[datetime]) -> datetime:
        return v or datetime.now(timezone.utc)


class TelemetriaBatchInput(BaseModel):
    id_usuario: int = Field(..., gt=0)
    dispositivo: str = Field(default="smartwatch", description="Origen del batch")
    puntos: List[TelemetriaItemBatch] = Field(..., min_length=1, max_length=500)


# ---------------------------------------------------------------------------
# Salida
# ---------------------------------------------------------------------------
class UbicacionOut(BaseModel):
    id_usuario: int
    ubicacion: GeoJSONPoint
    precision_metros: Optional[float] = None
    fecha_hora: datetime
    modo: Optional[ModoTransmision] = None


class TrayectoriaOut(BaseModel):
    id_usuario: int
    total_puntos: int
    puntos: List[UbicacionOut]


class IngestaResponse(BaseModel):
    mensaje: str
    id_registro: str
    timestamp_servidor: datetime


class IngestaBatchResponse(BaseModel):
    mensaje: str
    ids_registrados: List[str]
    total_insertados: int
    timestamp_servidor: datetime