from pydantic import BaseModel, Field
from typing import Optional


class UbicacionTestCreate(BaseModel):
    id_usuario: int
    latitud: float
    longitud: float
    precision_metros: Optional[float] = None

    model_config = {
        "json_schema_extra": {
            "examples": [{"id_usuario": 1, "latitud": 19.432608, "longitud": -99.133209, "precision_metros": 5.0}]
        }
    }

class GeocercaTestCreate(BaseModel):
    id_usuario: int
    nombre: str
    tipo_zona: str = Field(..., pattern="^(segura|riesgo)$")
    latitud: float
    longitud: float
    radio_metros: float

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "id_usuario": 1,
                "nombre": "Casa",
                "tipo_zona": "segura",
                "latitud": 19.432608,
                "longitud": -99.133209,
                "radio_metros": 100.0
            }]
        }
    }
