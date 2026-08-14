# schemas/dispositivo.py

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class TipoDispositivoEnum(str, Enum):
    movil = "movil"
    hardware = "hardware"
    wearable = "wearable"

class DispositivoBase(BaseModel):
    tipo_dispositivo: TipoDispositivoEnum
    numero_equipo: int = Field(default=1, ge=1, description="Número de equipo asignado al usuario (1, 2, 3...)")
    token_fcm: Optional[str] = None
    modelo: Optional[str] = None
    id_dispositivo_vinculado: Optional[int] = None

class DispositivoCreate(DispositivoBase):
    id_usuario: int

class DispositivoUpdate(BaseModel):
    token_fcm: Optional[str] = None
    modelo: Optional[str] = None
    activo: Optional[bool] = None
    ultima_conexion: Optional[datetime] = None

class DispositivoOut(DispositivoBase):
    id_dispositivo: int
    id_usuario: int
    activo: bool
    fecha_registro: datetime
    ultima_conexion: Optional[datetime] = None

    class Config:
        from_attributes = True  # Pydantic v2 (en v1 usa orm_mode = True)