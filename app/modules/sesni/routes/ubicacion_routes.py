"""
modules/sesni/routes/ubicacion_routes.py

Endpoints del Módulo 3: Ingesta y Telemetría de Ubicación (GPS Telemetry).

NOTA sobre autenticación:
El módulo depende del Módulo IAM para validar el token JWT (ver punto 6,
"Dependencias (Consume)"). Como el módulo IAM no aparece en el árbol de
carpetas compartido, se deja un stub `verify_token` con la firma esperada.
Reemplázalo por el import real, por ejemplo:
    from app.modules.iam.services.auth_service import verify_token
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config.mongo_config import get_database
from app.modules.sesni.controllers import ubicacion_controller as controller
from app.modules.sesni.schemas.ubicacion_schema import (
    IngestaBatchResponse,
    IngestaResponse,
    TelemetriaBatchInput,
    TelemetriaInput,
    TrayectoriaOut,
    UbicacionOut,
)

router = APIRouter(prefix="/ubicaciones", tags=["GPS Telemetry"])


# ---------------------------------------------------------------------------
# Dependencia de autenticación (placeholder — sustituir por el IAM real)
# ---------------------------------------------------------------------------
async def verify_token() -> dict:
    """
    Placeholder de validación de JWT emitido por el Módulo IAM.
    Sustituir por la dependencia real del proyecto, p. ej.:
        oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
        async def verify_token(token: str = Depends(oauth2_scheme)) -> dict: ...
    """
    return {"sub": "placeholder-user"}


# ---------------------------------------------------------------------------
# 1. Ingestar coordenada (alta frecuencia, modo normal/emergencia)
# ---------------------------------------------------------------------------
@router.post(
    "/",
    response_model=IngestaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingestar una coordenada GPS individual",
)
async def ingestar_coordenada(
    data: TelemetriaInput,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _usuario_token: dict = Depends(verify_token),
):
    return await controller.ingestar_coordenada_controller(db, data)


# ---------------------------------------------------------------------------
# 2. Ingesta por ráfaga (batch) — smartwatches
# ---------------------------------------------------------------------------
@router.post(
    "/batch",
    response_model=IngestaBatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingestar una ráfaga de coordenadas (sincronización de smartwatch)",
)
async def ingestar_batch(
    data: TelemetriaBatchInput,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _usuario_token: dict = Depends(verify_token),
):
    return await controller.ingestar_batch_controller(db, data)


# ---------------------------------------------------------------------------
# 3. Obtener última ubicación de un usuario
# ---------------------------------------------------------------------------
@router.get(
    "/{id_usuario}/ultima",
    response_model=UbicacionOut,
    summary="Obtener la última ubicación conocida de un usuario",
)
async def obtener_ultima_ubicacion(
    id_usuario: int,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _usuario_token: dict = Depends(verify_token),
):
    return await controller.obtener_ultima_ubicacion_controller(db, id_usuario)


# ---------------------------------------------------------------------------
# 4. Recuperar historial de trayectorias
# ---------------------------------------------------------------------------
@router.get(
    "/{id_usuario}/historial",
    response_model=TrayectoriaOut,
    summary="Recuperar el historial de trayectorias de un usuario en un rango de fechas",
)
async def obtener_historial(
    id_usuario: int,
    fecha_inicio: Optional[datetime] = Query(default=None),
    fecha_fin: Optional[datetime] = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _usuario_token: dict = Depends(verify_token),
):
    return await controller.obtener_historial_controller(
        db, id_usuario, fecha_inicio, fecha_fin
    )


# ---------------------------------------------------------------------------
# 5. Bonus: búsqueda geoespacial de ubicaciones cercanas ($near, 2dsphere)
# ---------------------------------------------------------------------------
@router.get(
    "/cercanas",
    response_model=list[UbicacionOut],
    summary="Buscar ubicaciones dentro de un radio (consulta geoespacial $near)",
)
async def buscar_cercanas(
    longitud: float = Query(..., ge=-180, le=180),
    latitud: float = Query(..., ge=-90, le=90),
    radio_metros: float = Query(default=500, gt=0, le=50000),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _usuario_token: dict = Depends(verify_token),
):
    return await controller.buscar_cercanas_controller(
        db, longitud, latitud, radio_metros
    )