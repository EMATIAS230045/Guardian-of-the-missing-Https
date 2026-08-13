from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, Literal

# Tipos definidos con Literal para validar los valores exactos del Enum de MySQL
RiesgoEnum = Literal['alta', 'media', 'baja']
EstadoEnum = Literal['activa', 'atendida', 'cancelada', 'falsa_alarma']

# 1. Base: Campos comunes
class AlertaBase(BaseModel):
    latitud: float
    longitud: float
    comentario: Optional[str] = None
    id_geocerca_mongo: Optional[str] = Field(default="Geo-01", examples=["Geo-01"])
    nivel_riesgo: Optional[RiesgoEnum] = "alta"


# 2. Para CREAR (POST)
class AlertaCreate(AlertaBase):
    id_usuario: int
    id_dispositivo: Optional[int] = None
    estado: Optional[EstadoEnum] = "activa"


# 3. Para ACTUALIZAR (PUT / PATCH)
class AlertaUpdate(BaseModel):
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    nivel_riesgo: Optional[RiesgoEnum] = None
    estado: Optional[EstadoEnum] = None
    comentario: Optional[str] = None


# 4. Para RESPONDER al cliente (GET / Return)
class AlertaResponse(AlertaBase):
    id_alerta: int
    id_usuario: int
    id_dispositivo: Optional[int] = None
    estado: EstadoEnum
    fecha_hora: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

#Endpoints para la generacion de alertas inteligentes: 

# Esquema exclusivo para la entrada del Botón de Pánico
class AlertaPanicoCreate(BaseModel):
    id_usuario: int
    id_dispositivo: Optional[int] = None
    latitud: float
    longitud: float
    id_geocerca_mongo: Optional[str] = Field(default="Geo-01", examples=["Geo-01"])

class AlertaCancelar(BaseModel):
    id_alerta: int
    id_usuario: int
    pin: str = Field(..., description="PIN de cancelación de 4 a 6 dígitos", min_length=4, max_length=6)
