import sys
import os
sys.path.append(os.getcwd())

from app.database.models import UsuarioResponse, TipoSangre
from datetime import datetime

# Simulate the string coming from the DB
data = {
    "id_usuario": 1,
    "nombre": "Test",
    "apellido_paterno": "Test",
    "correo": "test@test.com",
    "id_rol": 2,
    "activo": True,
    "fecha_registro": datetime.now(),
    "tipo_sangre": "A+" # The DB string
}

try:
    response = UsuarioResponse(**data)
    print("Success!", response.tipo_sangre)
except Exception as e:
    print("Error:", e)
