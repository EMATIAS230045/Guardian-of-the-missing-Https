"""
modules/sesni/schemas/geocerca_schema.py

Contratos de entrada/salida del Módulo 4: Análisis Geoespacial y Geocercas
Inteligentes. Reutiliza el mismo estándar GeoJSON del Módulo 3
(coordinates = [longitud, latitud]).
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from app.modules.mati.schemas.ubicacion_schema import GeoJSONPoint


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class TipoZona(str, Enum):
    SEGURA = "segura"
    RIESGO = "riesgo"


class TipoEvento(str, Enum):
    BREACH_DETECTED = "breach_detected"        # violó zona segura / entró a riesgo
    PROXIMITY_WARNING = "proximity_warning"     # se acerca a un hotspot
    SIN_EVENTO = "sin_evento"


# ---------------------------------------------------------------------------
# Entrada: definición manual de geocerca
# ---------------------------------------------------------------------------
class GeocercaInput(BaseModel):
    id_usuario: int = Field(..., gt=0, description="Referencia lógica a MySQL")
    nombre: str = Field(..., min_length=1, max_length=120, examples=["Casa"])
    tipo_zona: TipoZona = Field(default=TipoZona.SEGURA)
    ubicacion: GeoJSONPoint
    radio_metros: float = Field(..., gt=0, le=50000)
    activa: bool = Field(default=True)

    class Config:
        json_schema_extra = {
            "example": {
                "id_usuario": 152,
                "nombre": "Casa",
                "tipo_zona": "segura",
                "ubicacion": {"type": "Point", "coordinates": [-98.0531, 20.2782]},
                "radio_metros": 150,
                "activa": True,
            }
        }


class GeocercaUpdate(BaseModel):
    """Todos los campos opcionales — solo se actualizan los enviados."""

    nombre: Optional[str] = Field(default=None, min_length=1, max_length=120)
    ubicacion: Optional[GeoJSONPoint] = None
    radio_metros: Optional[float] = Field(default=None, gt=0, le=50000)
    activa: Optional[bool] = None


# ---------------------------------------------------------------------------
# Salida
# ---------------------------------------------------------------------------
class GeocercaOut(BaseModel):
    id: str
    id_usuario: Optional[int] = None
    nombre: str
    tipo_zona: TipoZona
    ubicacion: GeoJSONPoint
    radio_metros: float
    activa: bool
    fecha_creacion: datetime
    origen: str = Field(default="manual", description="'manual' o 'dbscan'")
    total_incidentes: Optional[int] = Field(
        default=None, description="Solo presente en zonas generadas por DBSCAN"
    )


# ---------------------------------------------------------------------------
# Evaluación Point-in-Polygon / Proximity
# ---------------------------------------------------------------------------
class EvaluacionInput(BaseModel):
    """
    Si no se envía 'ubicacion', el servicio consulta automáticamente la
    última coordenada del usuario en la colección 'ubicaciones' (Módulo 3).
    """

    id_usuario: int = Field(..., gt=0)
    numero_equipo: int = Field(default=1, description="Número de equipo relativo al usuario (1, 2...)")
    ubicacion: Optional[GeoJSONPoint] = None
    radio_proximidad_metros: float = Field(
        default=300, gt=0, le=10000,
        description="Distancia adicional al radio de la geocerca para disparar proximity_warning",
    )
    # 🔑 Agregamos el token FCM como opcional:
    token_fcm: Optional[str] = Field(
        default=None, 
        description="Token de Firebase para notificaciones Push al dispositivo"
    )


class GeocercaAfectada(BaseModel):
    id: str
    nombre: str
    tipo_zona: TipoZona
    distancia_metros: float


class EvaluacionOut(BaseModel):
    id_usuario: int
    evento: TipoEvento
    geocercas_afectadas: List[GeocercaAfectada] = Field(default_factory=list)
    evaluado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# DBSCAN — clustering de zonas de riesgo
# ---------------------------------------------------------------------------
class DBSCANParams(BaseModel):
    epsilon_metros: float = Field(
        default=500, gt=0, le=20000,
        description="Radio máximo (m) para considerar alertas vecinas",
    )
    min_puntos: int = Field(
        default=5, ge=2, le=1000,
        description="Mínimo de reportes dentro del radio epsilon para formar un clúster",
    )
    estados_incluidos: List[str] = Field(
        default=["activa", "atendida"],
        description="Estados de la tabla Alertas a considerar en el clustering",
    )

    @field_validator("estados_incluidos")
    @classmethod
    def validar_estados(cls, v: List[str]) -> List[str]:
        permitidos = {"activa", "atendida", "falsa_alarma"}
        invalidos = set(v) - permitidos
        if invalidos:
            raise ValueError(f"Estados no válidos: {invalidos}")
        return v


class ClusterResultado(BaseModel):
    id_geocerca: str
    centroide: GeoJSONPoint
    radio_metros: float
    total_incidentes: int


class DBSCANResponse(BaseModel):
    mensaje: str
    clusters_generados: int
    clusters: List[ClusterResultado]
    puntos_ruido: int
    ejecutado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))