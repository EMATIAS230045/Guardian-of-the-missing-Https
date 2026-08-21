#Esta es para utilizar todo los metodos de Fast Api entorno a las rutas que responde
##el servidor y la otra sirve para ejecutar un funicion y devuelva el resultado
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
#algunas cosas que se relaciona
#Esta libreria se relaciona con la creacion de session de base de datos 
#funcionando como plantilla que vamos a rellenar con nuestras credenciales
from sqlalchemy.orm import Session
#Esta la funcion que continen las credenciales y nos ayuda a crear la conexion con mysql
from app.modules.mati.services.mysql.mysql import get_db
#Este funciona como filtro para que cuando se envie un registro hacia las alerta primero
#compruebe si tiene la estructura del esquema
from app.modules.mati.schemas.alerta import AlertaCreate, AlertaResponse, AlertaUpdate, AlertaPanicoCreate, AlertaCancelar
#Esto es para traer nuestros controladores y llamarlos cuando se realice una peticion y decimos todo lo que esta aqui
#refiere a el como alerta_controller
from app.modules.mati.controllers import alerta as alerta_controller
#from controllers.Alertas import buscar_alerta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

router = APIRouter(prefix="/alertas", tags=["Alertas"])

@router.post("/", response_model=AlertaResponse, status_code=status.HTTP_201_CREATED)
async def crear(alerta: AlertaCreate, db: AsyncSession = Depends(get_db)):
    return await alerta_controller.crear_alerta(db, alerta)

@router.get("/", response_model=List[AlertaResponse])
async def listar(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await alerta_controller.obtener_alertas(db, skip=skip, limit=limit)

@router.get("/{id_alerta}", response_model=AlertaResponse)
async def obtener(id_alerta: int, db: AsyncSession = Depends(get_db)):
    alerta = await alerta_controller.obtener_alerta_por_id(db, id_alerta)
    if not alerta:
        raise HTTPException(status_code=404, detail="La alerta no existe")
    return alerta

@router.put("/{id_alerta}", response_model=AlertaResponse)
async def actualizar(id_alerta: int, alerta_in: AlertaUpdate, db: AsyncSession = Depends(get_db)):
    alerta = await alerta_controller.actualizar_alerta(db, id_alerta, alerta_in)
    if not alerta:
        raise HTTPException(status_code=404, detail="La alerta no existe")
    return alerta

@router.delete("/{id_alerta}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar(id_alerta: int, db: AsyncSession = Depends(get_db)):
    exito = await alerta_controller.eliminar_alerta(db, id_alerta)
    if not exito:
        raise HTTPException(status_code=404, detail="La alerta no existe")
    return None

#Rutas para alertas inteligentes:


@router.post("/panico", response_model=AlertaResponse, status_code=status.HTTP_201_CREATED)
async def activar_boton_panico(
    datos: AlertaPanicoCreate, 
    db: AsyncSession = Depends(get_db)
):
    return await alerta_controller.crear_alerta_panico(db, datos)

# routes/Alertas.py

@router.post("/cancelar")
async def cancelar_alerta(
    datos: AlertaCancelar,
    db: AsyncSession = Depends(get_db)
):
    """
    Cancela una alerta validando el PIN con hash SHA-256 y control de fuerza bruta.
    """
    return await alerta_controller.cancelar_alerta_con_pin(db, datos)

@router.patch("/{id_alerta}/atender", response_model=AlertaResponse)
async def atender_alerta(id_alerta: int, db: AsyncSession = Depends(get_db)):
    return await alerta_controller.atender_alerta(db, id_alerta)

@router.patch("/{id_alerta}/falsa-alarma", response_model=AlertaResponse)
async def falsa_alarma(id_alerta: int, db: AsyncSession = Depends(get_db)):
    return await alerta_controller.marcar_falsa_alarma(db, id_alerta)