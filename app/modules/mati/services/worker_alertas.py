import asyncio
import logging
from typing import Dict, Optional

from sqlalchemy.orm import Session
from app.modules.mati.services.mysql.mysql import get_async_db as get_db

# Importar controladores de alertas
import app.modules.mati.controllers.alerta as alerta_controller

# Configurar logger
logger = logging.getLogger("worker_alertas")
logger.setLevel(logging.INFO)

# Registro de tareas en memoria
TAREAS_ACTIVAS: Dict[int, asyncio.Task] = {}


# --------------------------------------------------------------------------
# PLACEHOLDERS DE NOTIFICACIÓN
# --------------------------------------------------------------------------
async def enviar_push_fcm(token: Optional[str], titulo: str, mensaje: str, data: dict = None):
    mensaje_log = f"📲 [PUSH SENT] Para token: {token} | Título: '{titulo}' | Datos: {data}"
    logger.info(mensaje_log)
    #print(mensaje_log, flush=True)


async def notificar_contactos_emergencia(db, id_usuario: int, alerta):
    mensaje_log = f"🚨 [CONTACTOS NOTIFICADOS] Escalación riesgo alto para Usuario #{id_usuario} | Alerta #{alerta.id_alerta}"
    logger.warning(mensaje_log)
    #print(mensaje_log, flush=True)


# --------------------------------------------------------------------------
# CONTROLADOR DEL WORKER
# --------------------------------------------------------------------------
def cancelar_worker_alerta(id_alerta: int) -> bool:
    """Cancela la cuenta regresiva del worker si el usuario responde o sale de la zona."""
    task = TAREAS_ACTIVAS.get(id_alerta)
    if task and not task.done():
        task.cancel()
        TAREAS_ACTIVAS.pop(id_alerta, None)
        
        msg = f"⏰ [Worker] Cuenta regresiva de la Alerta #{id_alerta} fue CANCELADA."
        logger.info(msg)
        print(msg, flush=True)
        return True
    return False


async def procesar_temporizador_seguridad(
    id_alerta: int,
    id_usuario: int,
    token_fcm: Optional[str] = None,
    tiempo_t3_segundos: int = 180,  # ⚡ 10s para pruebas (en prod: 3m)
    tiempo_t2_segundos: int = 120   # ⚡ 10s para pruebas (en prod: 2m)
):
    try:
        msg_start = f"⏳ [Worker Started] Alerta #{id_alerta} (Usuario #{id_usuario}). Temporizador T+3 corriendo..."
        logger.info(msg_start)
        #print(msg_start, flush=True)

        # ------------------------------------------------------------------
        # FASE 1: Espera T+3 minutos
        # ------------------------------------------------------------------
        await asyncio.sleep(tiempo_t3_segundos)

        async for db in get_db():
            alerta = await alerta_controller.obtener_alerta_por_id(db, id_alerta)

            # Si ya no está activa, detenemos
            if not alerta or alerta.estado in ["cancelada", "SAFE_IN_ZONE", "RESUELTA"]:
                msg_stop = f"ℹ️ [Worker] Alerta #{id_alerta} ya no requiere confirmación (Estado: {getattr(alerta, 'estado', 'N/A')})."
                logger.info(msg_stop)
                print(msg_stop, flush=True)
                return

            msg_push = f"📲 [Worker T+3 Expire] Alerta #{id_alerta} activa. Solicitando PIN vía Push..."
            logger.info(msg_push)
            print(msg_push, flush=True)
            
            await enviar_push_fcm(
                token=token_fcm,
                titulo="¿Te encuentras bien?",
                mensaje="Sigues en la zona de riesgo. Ingresa tu PIN para confirmar tu seguridad.",
                data={"id_alerta": str(id_alerta), "accion": "PEDIR_PIN"}
            )

            await alerta_controller.actualizar_estado_alerta(
                db, id_alerta=id_alerta, nuevo_estado="ESPERANDO_PIN"
            )
            break

        # ------------------------------------------------------------------
        # FASE 2: Espera T+2 minutos para validación de PIN
        # ------------------------------------------------------------------
        msg_t2 = f"⏳ [Worker T+2] Esperando PIN para Alerta #{id_alerta} ({tiempo_t2_segundos}s)..."
        logger.info(msg_t2)
        print(msg_t2, flush=True)
        
        await asyncio.sleep(tiempo_t2_segundos)

        async for db in get_db():
            alerta = await alerta_controller.obtener_alerta_por_id(db, id_alerta)

            if alerta and alerta.estado == "ESPERANDO_PIN":
                msg_crit = f"🚨 [Worker T+2 Expire] ¡Alerta #{id_alerta} SIN RESPUESTA! Escalando a Riesgo alto."
                logger.error(msg_crit)
                #print(msg_crit, flush=True)

                await alerta_controller.actualizar_estado_alerta(
                    db,
                    id_alerta=id_alerta,
                    nuevo_estado="activa",
                    nuevo_riesgo="alto",
                    comentario_extra="[SISTEMA] Escalado por falta de respuesta a PIN (T+5 min)."
                )

                await notificar_contactos_emergencia(db, id_usuario, alerta)
            break

    except asyncio.CancelledError:
        msg_cancel = f"🛑 [Worker Cancelled] Temporizador de la Alerta #{id_alerta} cancelado voluntariamente."
        logger.info(msg_cancel)
        print(msg_cancel, flush=True)
    except Exception as e:
        msg_err = f"❌ [Worker Error] Error en worker de Alerta #{id_alerta}: {str(e)}"
        logger.error(msg_err, exc_info=True)
        print(msg_err, flush=True)
    finally:
        TAREAS_ACTIVAS.pop(id_alerta, None)