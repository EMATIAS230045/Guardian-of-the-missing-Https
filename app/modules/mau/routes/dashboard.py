from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from typing import Dict, Any
from datetime import datetime, timedelta, timezone
from app.modules.mau.database import obtener_sesion
from app.modules.mau.security import obtener_usuario_actual
from app.database.models import Alerta, EstadoAlerta, Usuario

# Suponiendo que tienes tus dependencias configuradas en otros módulos:
# from app.modules.mau.database import get_session
# from dependencies import obtener_usuario_actual
# from models import Alerta, EstadoAlerta, Usuario

router = APIRouter(
    prefix="/analytics",
    tags=["Dashboard & Analytics"]
)

@router.get("/kpis", response_model=Dict[str, Any])
def obtener_kpis(
    db: Session = Depends(obtener_sesion),
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):
    """
    Genera un resumen estadístico (KPIs) de las alertas.
    - Rol 1 (Admin Gobierno): Métricas globales del sistema.
    - Rol 2 (Usuario Estándar): Métricas exclusivas de sus propios incidentes.
    """
    
    # 1. Aplicación de Filtros Granulares por Rol
    filtros_base = []
    
    # Asumimos que id_rol == 1 es Administrador, cualquier otro es Usuario Estándar
    if usuario_actual.id_rol != 1:
        # Los usuarios solo pueden ver la analítica de sus propias alertas
        filtros_base.append(Alerta.id_usuario == usuario_actual.id_usuario)

    # 2. Cálculo del Volumen Total de Alertas
    query_total = select(func.count(Alerta.id_alerta)).where(*filtros_base)
    total_alertas = db.exec(query_total).one()

    # 3. Desglose de Alertas por Estado (Agregación)
    kpis_estado = {}
    for estado in EstadoAlerta:
        query_estado = select(func.count(Alerta.id_alerta)).where(
            *filtros_base,
            Alerta.estado == estado
        )
        # db.exec().one() devuelve un entero gracias a func.count()
        kpis_estado[estado.value] = db.exec(query_estado).one()

    # 4. Tendencia: Incidentes del último mes (30 días)
    fecha_limite = datetime.now(timezone.utc) - timedelta(days=30)
    query_ultimo_mes = select(func.count(Alerta.id_alerta)).where(
        *filtros_base,
        Alerta.fecha_hora >= fecha_limite
    )
    alertas_recientes = db.exec(query_ultimo_mes).one()

    # 5. Construcción del Payload JSON Diferenciado
    return {
        "metadata": {
            "solicitante_id": usuario_actual.id_usuario,
            "rol_acceso": "Administrador" if usuario_actual.id_rol == 1 else "Usuario Estándar",
            "timestamp_consulta": datetime.now(timezone.utc).isoformat()
        },
        "kpis": {
            "total_incidentes_historico": total_alertas,
            "incidentes_ultimos_30_dias": alertas_recientes,
            "desglose_por_estado": kpis_estado
        }
    }
