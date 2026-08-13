# 🚀 Guía de Inicio: Guardian of the Missing

Este documento contiene todos los comandos exactos y las credenciales que necesitas para levantar el ecosistema completo del proyecto desde cero en tu computadora en cualquier momento.

Para trabajar de la manera más cómoda, te recomiendo **abrir 3 ventanas de terminal (consola) distintas**, una para cada parte del proyecto.

---

## 1️⃣ Backend (FastAPI y WebSockets)
Este es el cerebro del sistema. Se encarga de conectar la base de datos (MySQL y MongoDB) y repartir los mensajes en tiempo real.

**Comandos:**
```bash
cd C:\Users\garci\Desktop\GuardianOfTheMising
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Nota:* El comando `--host 0.0.0.0` es vital para que tu celular (que está en tu red Wi-Fi) pueda comunicarse con la computadora.

---

## 2️⃣ Página Web (Angular)
Este es el panel de control o Dashboard, donde recibirás las alertas en tiempo real y verás el mapa.

**Comandos:**
```bash
cd C:\Users\garci\Desktop\GuardianOfTheMising\frontend\web
npm start
```
*Una vez que termine de cargar, entra en tu navegador a:* [http://localhost:4200](http://localhost:4200)

> [!TIP]
> **Credenciales de Prueba (Web):**
> Al estar en versión de pruebas, usa estos datos para entrar al Dashboard:
> - **Correo:** `diegomiguel04@gmail.com`
> - **Contraseña:** `diego123#`

---

## 3️⃣ Aplicación Móvil (React Native / Expo)
Esta es la app que llevas en el bolsillo con el botón de pánico de alta precisión.

**Comandos:**
```bash
cd C:\Users\garci\Desktop\GuardianOfTheMising\frontend\android
npm start
```
*(También puedes usar `npx expo start`)*.

Esto te arrojará un código QR grande en la consola. Solo debes escanearlo con la cámara de tu celular (o usar la app de Expo Go) para que se instale la aplicación al vuelo.

> [!IMPORTANT]
> **Regla de Oro para el Celular:**
> 1. Asegúrate de que tu celular y tu computadora estén conectados **al mismo módem Wi-Fi**. Si tu celular está en "Datos Móviles", no podrá enviarle el mensaje al Backend de tu computadora.
> 2. Si la IP de tu computadora cambia (suele pasar cuando reinicias el módem), debes actualizar el archivo `frontend/android/services/api.ts` con tu nueva dirección IPv4 local (ejemplo: `http://192.168.1.71:8000`).

---

## 🔄 Flujo de Prueba
Cuando quieras demostrarle a alguien el proyecto, sigue este orden:
1. Enciende las 3 terminales (Backend, Web, App Móvil).
2. Inicia sesión en la Web en tu computadora y déjala a la vista.
3. Toma tu celular real y presiona el **Botón de Pánico**.
4. ¡El celular usará tu antena GPS, enviará el dato al Backend por Wi-Fi, y el Backend se lo inyectará a tu navegador web usando WebSockets instantáneamente para mostrarte la calle exacta!
