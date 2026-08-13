import uvicorn
from app.main import app
import threading
import time
import requests

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="debug")

t = threading.Thread(target=run_server, daemon=True)
t.start()
time.sleep(3) # Wait for server to start

url = 'http://127.0.0.1:8001/auth/registro'
payload = {
    "nombre": "Test",
    "apellido_paterno": "Usuario",
    "correo": "test2@test.com",
    "contrasena": "password123",
    "fecha_nacimiento": "2000-01-01"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
