import requests
import json

payload = {
    "id_usuario": 1,
    "id_dispositivo": None,
    "latitud": 10.0,
    "longitud": 9.0,
    "id_geocerca_mongo": "zona-segura"
}
try:
    response = requests.post("http://127.0.0.1:8000/alertas/panico", json=payload)
    print(response.status_code)
    print(response.text)
except Exception as e:
    print(e)
