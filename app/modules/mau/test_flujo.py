import requests
import time

# Configuración base
BASE_URL = "http://127.0.0.1:8000"  # Cambia el puerto si tu FastAPI corre en otro distinto
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjb3JyZW9AY29ycmVvLmNvbSIsImlkX3VzdWFyaW8iOjIsImlkX3JvbCI6MSwiZXhwIjoxNzg1MjczMDc3fQ.MbYWQ4Nyqevy7ymJnMWaf6mYqurCxklGTbk9y6R060s"  # Genera uno haciendo login primero

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def probar_crud_contactos():
    print("🚀 INICIANDO PRUEBAS DEL CRUD DE CONTACTOS DE EMERGENCIA...\n")

    # ==========================================
    # 1. CREAR UN CONTACTO (POST)
    # ==========================================
    print("1️⃣ Probando CREAR (POST)...")
    datos_nuevo = {
        "nombre": "Contacto de Prueba",
        "telefono": "7771234567",
        "correo": "prueba@ejemplo.com",
        "parentesco": "Hermano",
        "prioridad": 2
    }
    
    res_post = requests.post(f"{BASE_URL}/contactos-emergencia/", json=datos_nuevo, headers=HEADERS)
    
    if res_post.status_code == 201:
        contacto_creado = res_post.json()
        id_contacto = contacto_creado["id_contacto"]
        print(f"✅ Éxito: Contacto creado con ID {id_contacto}")
        print(f"   Datos: {contacto_creado}\n")
    else:
        print(f"❌ Error al crear: {res_post.status_code} - {res_post.text}")
        return # Detenemos la prueba si falla la creación

    time.sleep(1)

    # ==========================================
    # 2. LEER CONTACTOS (GET)
    # ==========================================
    print("2️⃣ Probando LEER TODOS (GET)...")
    res_get = requests.get(f"{BASE_URL}/contactos-emergencia/", headers=HEADERS)
    
    if res_get.status_code == 200:
        contactos = res_get.json()
        print(f"✅ Éxito: Se obtuvieron {len(contactos)} contactos.")
        # Verificamos que nuestro contacto esté en la lista
        encontrado = any(c["id_contacto"] == id_contacto for c in contactos)
        print(f"   ¿El nuevo contacto está en la lista?: {'Sí' if encontrado else 'No'}\n")
    else:
        print(f"❌ Error al leer: {res_get.status_code} - {res_get.text}")

    time.sleep(1)

    # ==========================================
    # 3. ACTUALIZAR CONTACTO (PATCH)
    # ==========================================
    print("3️⃣ Probando ACTUALIZAR (PATCH)...")
    # Solo actualizaremos el teléfono y la prioridad
    datos_actualizar = {
        "telefono": "9998887777",
        "prioridad": 1
    }
    
    res_patch = requests.patch(f"{BASE_URL}/contactos-emergencia/{id_contacto}", json=datos_actualizar, headers=HEADERS)
    
    if res_patch.status_code == 200:
        contacto_actualizado = res_patch.json()
        print(f"✅ Éxito: Contacto {id_contacto} actualizado.")
        print(f"   Nuevo teléfono: {contacto_actualizado['telefono']}")
        print(f"   Nueva prioridad: {contacto_actualizado['prioridad']}\n")
    else:
        print(f"❌ Error al actualizar: {res_patch.status_code} - {res_patch.text}")

    time.sleep(1)

    # ==========================================
    # 4. ELIMINAR CONTACTO (DELETE)
    # ==========================================
    print("4️⃣ Probando ELIMINAR (DELETE)...")
    res_delete = requests.delete(f"{BASE_URL}/contactos-emergencia/{id_contacto}", headers=HEADERS)
    
    if res_delete.status_code == 204:
        print(f"✅ Éxito: Contacto {id_contacto} eliminado correctamente.\n")
    else:
        print(f"❌ Error al eliminar: {res_delete.status_code} - {res_delete.text}")

    # ==========================================
    # 5. VERIFICAR ELIMINACIÓN (GET OTRA VEZ)
    # ==========================================
    print("5️⃣ Verificando que ya no exista...")
    res_verify = requests.get(f"{BASE_URL}/contactos-emergencia/", headers=HEADERS)
    if res_verify.status_code == 200:
        contactos_finales = res_verify.json()
        aun_existe = any(c["id_contacto"] == id_contacto for c in contactos_finales)
        if not aun_existe:
            print("✅ Éxito: El contacto ya no aparece en la lista.")
        else:
            print("❌ Error: El contacto sigue apareciendo.")
    
    print("\n🏁 PRUEBA FINALIZADA.")

if __name__ == "__main__":
    probar_crud_contactos()
