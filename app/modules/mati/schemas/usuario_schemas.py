# schemas/usuario.py
from pydantic import BaseModel, Field

class ConfigurarPinInput(BaseModel):
    id_usuario: int
    pin: str = Field(..., min_length=4, max_length=8, description="PIN de seguridad de 4 a 8 dígitos")