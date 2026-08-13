import subprocess
import time
import requests

process = subprocess.Popen(["python", "-m", "uvicorn", "app.main:app", "--port", "8002"], stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
time.sleep(4) 

payload = {
    "id_usuario": 1,
    "id_dispositivo": None,
    "latitud": 10.0,
    "longitud": 9.0,
    "id_geocerca_mongo": "zona-segura"
}
try:
    response = requests.post("http://127.0.0.1:8002/alertas/panico", json=payload)
    print("STATUS:", response.status_code)
except Exception as e:
    print("ERR:", e)

process.terminate()
outs, errs = process.communicate()
print("ERRORS:\n", errs)
