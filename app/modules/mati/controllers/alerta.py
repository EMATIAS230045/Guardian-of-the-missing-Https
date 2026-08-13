from fastapi import HTTPException, status
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database.models import Alerta, Usuario, NivelRiesgo, EstadoAlerta
from app.modules.mati.schemas.alerta import AlertaCreate, AlertaUpdate, AlertaPanicoCreate, AlertaCancelar
from app.modules.mati.services.security import verificar_pin

# CREAR
async def crear_alerta(db: AsyncSession, alerta_data: AlertaCreate) -> Alerta:
    nueva_alerta = Alerta(**alerta_data.model_dump())
    db.add(nueva_alerta)
    await db.commit()
    await db.refresh(nueva_alerta)
    return nueva_alerta

# OBTENER TODAS (Con paginación opcional)
async def obtener_alertas(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Alerta]:
    result = await db.execute(select(Alerta).offset(skip).limit(limit))
    return result.scalars().all()

# OBTENER UNA POR ID
async def obtener_alerta_por_id(db: AsyncSession, id_alerta: int) -> Alerta | None:
    result = await db.execute(select(Alerta).filter(Alerta.id_alerta == id_alerta))
    return result.scalar_one_or_none()

# ACTUALIZAR
async def actualizar_alerta(db: AsyncSession, id_alerta: int, alerta_data: AlertaUpdate) -> Alerta | None:
    alerta = await obtener_alerta_por_id(db, id_alerta)
    if not alerta:
        return None
    
    # exclude_unset=True evita sobrescribir con None los campos que el usuario no mandó
    datos_actualizar = alerta_data.model_dump(exclude_unset=True)
    for clave, valor in datos_actualizar.items():
        setattr(alerta, clave, valor)
        
    await db.commit()
    await db.refresh(alerta)
    return alerta

# ELIMINAR
async def eliminar_alerta(db: AsyncSession, id_alerta: int) -> bool:
    alerta = await obtener_alerta_por_id(db, id_alerta)
    if not alerta:
        return False
        
    await db.delete(alerta)
    await db.commit()
    return True

async def crear_alerta_panico(db: AsyncSession, datos: AlertaPanicoCreate):
    # Creamos la instancia inyectando los valores fijos requeridos
    nueva_alerta = Alerta(
        id_usuario=datos.id_usuario,
        id_dispositivo=datos.id_dispositivo,
        latitud=datos.latitud,
        longitud=datos.longitud,
        id_geocerca_mongo=datos.id_geocerca_mongo,
        nivel_riesgo=NivelRiesgo.alta,             # Fijo por ser botón de pánico
        estado=EstadoAlerta.activa,                 # Estado predeterminado
        comentario="Boton de panico"     # Comentario automático
    )
    
    db.add(nueva_alerta)
    await db.commit()
    await db.refresh(nueva_alerta)
    
    from app.utils.websocket_manager import manager
    await manager.broadcast_all({
        "event": "NEW_ALERT",
        "data": {
            "id_alerta": nueva_alerta.id_alerta,
            "id_usuario": nueva_alerta.id_usuario,
            "latitud": float(nueva_alerta.latitud),
            "longitud": float(nueva_alerta.longitud),
            "nivel_riesgo": nueva_alerta.nivel_riesgo,
            "estado": nueva_alerta.estado,
            "comentario": nueva_alerta.comentario,
        }
    })
    
    return nueva_alerta

# --- HELPER PRIVADO (Reutilizable) ---
async def _obtener_alerta_activa(db: AsyncSession, id_alerta: int) -> Alerta:
    """Busca la alerta y verifica que exista y esté en estado 'activa'."""
    result = await db.execute(select(Alerta).where(Alerta.id_alerta == id_alerta))
    alerta = result.scalar_one_or_none()

    if not alerta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La alerta especificada no existe."
        )

    # Validar que solo se modifiquen alertas que estén 'activa'
    if alerta.estado != "activa":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transición inválida: la alerta ya está en estado '{alerta.estado}'."
        )

    return alerta


# --- CONTROLADORES PÚBLICOS ---

async def cancelar_alerta_con_pin(db: AsyncSession, datos: AlertaCancelar):
    # 1. Obtener la alerta activa
    alerta_activa = await _obtener_alerta_activa(db, datos.id_alerta)

    # 2. Obtener el usuario
    result_usr = await db.execute(select(Usuario).where(Usuario.id_usuario == datos.id_usuario))
    usuario = result_usr.scalar_one_or_none()

    if not usuario or not usuario.pin_cancelacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado o no tiene PIN configurado."
        )

    max_permitidos = usuario.max_intentos_pin or 3
    ahora = datetime.now(timezone.utc)

    # --- VERIFICACIÓN DE BLOQUEO POR FUERZA BRUTA (1 HORA) ---
    if (alerta_activa.intentos_fallidos or 0) >= max_permitidos:
        if alerta_activa.ultimo_intento_fallido:
            # Asegurar manejo correcto de zonas horarias
            ultimo_intento = alerta_activa.ultimo_intento_fallido
            if ultimo_intento.tzinfo is None:
                ultimo_intento = ultimo_intento.replace(tzinfo=timezone.utc)
            
            tiempo_transcurrido = ahora - ultimo_intento
            
            # Si aún no pasa 1 hora (3600 segundos), bloqueamos la petición
            if tiempo_transcurrido < timedelta(hours=1):
                minutos_restantes = int((timedelta(hours=1) - tiempo_transcurrido).total_seconds() // 60) + 1
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"La cancelación de esta alerta está bloqueada por seguridad. Reintenta en {minutos_restantes} minuto(s)."
                )
        
        # Si ya pasó la hora de castigo, reiniciamos el contador
        alerta_activa.intentos_fallidos = 0

    # 3. Validar el PIN
    if not verificar_pin(datos.pin, usuario.pin_cancelacion):
        # Actualizamos contador y fecha del último fallo
        alerta_activa.intentos_fallidos = (alerta_activa.intentos_fallidos or 0) + 1
        alerta_activa.ultimo_intento_fallido = ahora
        intentos_actuales = alerta_activa.intentos_fallidos

        # CASO A: Superó el límite (Se crea alerta de coacción y entra en bloqueo)
        if intentos_actuales >= max_permitidos:
            alerta_forzada = Alerta(
                id_usuario=datos.id_usuario,
                id_dispositivo=alerta_activa.id_dispositivo,
                latitud=alerta_activa.latitud,
                longitud=alerta_activa.longitud,
                nivel_riesgo="alta",
                estado="activa",
                comentario=f"ALERTA DE SEGURIDAD: Forzamiento de PIN ({max_permitidos} intentos fallidos al intentar cancelar alerta #{alerta_activa.id_alerta})",
                id_geocerca_mongo=alerta_activa.id_geocerca_mongo
            )
            db.add(alerta_forzada)
            await db.commit()

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PIN incorrecto. Límite alcanzado. La opción de cancelación ha sido bloqueada por 1 hora."
            )

        # CASO B: Error normal (Intento 1 o 2)
        intentos_restantes = max_permitidos - intentos_actuales
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PIN incorrecto. Te quedan {intentos_restantes} intento(s)."
        )

    # 4. PIN Correcto: Cancelar alerta
    alerta_activa.estado = "cancelada"
    await db.commit()
    await db.refresh(alerta_activa)

    return alerta_activa

# 2. activa -> atendida (Por Operador)
async def atender_alerta(db: AsyncSession, id_alerta: int):
    alerta = await _obtener_alerta_activa(db, id_alerta)
    alerta.estado = "atendida"
    
    await db.commit()
    await db.refresh(alerta)
    return alerta


# 3. activa -> falsa_alarma (Por Operador)
async def marcar_falsa_alarma(db: AsyncSession, id_alerta: int):
    alerta = await _obtener_alerta_activa(db, id_alerta)
    alerta.estado = "falsa_alarma"
    
    await db.commit()
    await db.refresh(alerta)
    return alerta

