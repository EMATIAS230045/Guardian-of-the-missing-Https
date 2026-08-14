from fastapi import APIRouter, HTTPException, status, File, UploadFile, Form
from app.modules.mati.schemas.mongo_test import UbicacionTestCreate, GeocercaTestCreate
from fastapi.responses import StreamingResponse
from app.modules.mati.services.Mongo.mongo import guardar_ubicacion_gps, crear_geocerca, probar_busqueda_geocerca, guardar_audio_gridfs, obtener_stream_audio_gridfs

router = APIRouter(prefix="/mongo-test", tags=["Pruebas MongoDB"])

@router.post("/ubicacion")
async def endpoint_guardar_ubicacion(datos: UbicacionTestCreate):
    id_insertado = await guardar_ubicacion_gps(
        id_usuario=datos.id_usuario,
        lat=datos.latitud,
        lon=datos.longitud,
        precision=datos.precision_metros
    )
    return {"mensaje": "Ubicación guardada en Mongo", "id_mongo": id_insertado}


@router.post("/geocerca")
async def endpoint_crear_geocerca(datos: GeocercaTestCreate):
    id_insertado = await crear_geocerca(
        id_usuario=datos.id_usuario,
        nombre=datos.nombre,
        tipo_zona=datos.tipo_zona,
        lat=datos.latitud,
        lon=datos.longitud,
        radio_metros=datos.radio_metros
    )
    return {"mensaje": "Geocerca creada exitosamente", "id_mongo": id_insertado}


@router.get("/validar-posicion")
async def endpoint_validar_posicion(id_usuario: int, latitud: float, longitud: float):
    geocerca_encontrada = await probar_busqueda_geocerca(id_usuario, latitud, longitud)
    if not geocerca_encontrada:
        return {"mensaje": "El punto está fuera de cualquier geocerca activa del usuario", "geocerca": None}
    
    return {"mensaje": "Punto dentro de geocerca", "geocerca": geocerca_encontrada}

# --- ENDPOINTS DE AUDIO (GRIDFS) ---

@router.post("/audio/subir")
async def endpoint_subir_audio(
    id_usuario: int = Form(...),
    archivo: UploadFile = File(...)
):
    """Recibe un archivo de audio (mp3, wav, m4a, etc.) y lo guarda en GridFS."""
    
    # Lectura del contenido binario
    contenido = await archivo.read()
    
    id_audio = await guardar_audio_gridfs(
        id_usuario=id_usuario,
        file_bytes=contenido,
        filename=archivo.filename,
        content_type=archivo.content_type or "audio/mpeg"
    )

    return {
        "mensaje": "Audio guardado exitosamente en GridFS",
        "id_audio_mongo": id_audio,
        "nombre_archivo": archivo.filename,
        "tamano_bytes": len(contenido)
    }


@router.get("/audio/{file_id}")
async def endpoint_obtener_audio(file_id: str):
    """Transmite (stream) el audio almacenado en GridFS por su ID."""
    
    grid_out = await obtener_stream_audio_gridfs(file_id)
    if not grid_out:
        raise HTTPException(status_code=404, detail="Archivo de audio no encontrado en MongoDB.")

    # Generador asíncrono para enviar el audio por fragmentos de 256 KB
    async def iterar_chunks():
        while True:
            chunk = await grid_out.read(256 * 1024)
            if not chunk:
                break
            yield chunk

    content_type = "audio/mpeg"
    if grid_out.metadata and "content_type" in grid_out.metadata:
        content_type = grid_out.metadata["content_type"]

    return StreamingResponse(
        iterar_chunks(),
        media_type=content_type,
        headers={"Content-Disposition": f'inline; filename="{grid_out.filename}"'}
    )