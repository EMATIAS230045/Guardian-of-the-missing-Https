# main.py
import models
from fastapi import FastAPI
from contextlib import asynccontextmanager
# Importamos tus configuraciones de base de datos
from app.modules.mati.services.mysql.mysql import engine, Base
from app.modules.mati.services.Mongo.mongo import client, crear_indices_mongo

# Importamos tu nuevo archivo de rutas
from app.modules.mati.routes import Alertas, mongo_test
#from app.modules.mati.routes import evidencias

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("¡Servidor iniciando!")
    
    # Creamos las tablas de MySQL de forma asíncrona
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await crear_indices_mongo()
        
    print(f"Motores listos: MySQL asíncrono y Mongo iniciados.")
    
    yield # Aquí el servidor se queda encendido atendiendo usuarios
    
    # Lo que pongas aquí abajo se ejecuta al apagar el servidor (limpieza)
    print("Apagando servidor y cerrando conexiones...")
    await engine.dispose()
    client.close() # Cerramos Mongo limpiamente

    # 2. Creamos la app pasándole el lifespan
app = FastAPI(
    title="Guardian Of The Missing",
    version="1.0.0",
    lifespan=lifespan
)

# 3. Conectamos el archivo de rutas a la aplicación principal
app.include_router(Alertas.router)
#app.include_router(evidencias.router)
app.include_router(mongo_test.router)

# Puedes dejar el root aquí como comprobación de salud del servidor
@app.get("/")
async def root():
    return {"mensaje": "El servidor funciona correctamente"}
