import requests

url = 'http://127.0.0.1:8000/auth/registro'
payload = {
    "nombre": "Test",
    "apellido_paterno": "Usuario",
    "correo": "test@test.com",
    "contrasena": "password123",
    "fecha_nacimiento": "2000-01-01"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
