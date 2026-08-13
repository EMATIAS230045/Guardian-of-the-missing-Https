# Guía de Despliegue Híbrido (FastAPI + TiDB Cloud + MongoDB Atlas + Render)

Esta guía te llevará paso a paso para tener tu aplicación **GuardianOfTheMising** completamente funcional en la nube con HTTPS gratuito y tus bases de datos separadas (SQL y NoSQL).

## Paso 1: Configurar la Base de Datos NoSQL (MongoDB Atlas)

1. Regístrate en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Crea un **Nuevo Proyecto** y despliega un clúster gratuito (**M0 Free**).
3. Selecciona la región más cercana a ti.
4. En **Database Access**, crea un usuario y contraseña (ej. `guardian_user` y `mi_password_seguro`). **Guarda esta contraseña**.
5. En **Network Access**, haz clic en *Add IP Address* y selecciona *Allow Access From Anywhere* (`0.0.0.0/0`) para que Render pueda conectarse.
6. Ve a **Database**, haz clic en **Connect** -> **Drivers** -> **Python**.
7. Copia el **Connection String** que te dan. Debería verse similar a esto:
   ```text
   mongodb+srv://guardian_user:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
8. Este será tu valor para la variable de entorno `MONGO_URI`. (Recuerda reemplazar `<password>`).

## Paso 2: Configurar la Base de Datos SQL (TiDB Cloud)

> Se recomienda **TiDB Cloud** por su plan Serverless gratuito y total compatibilidad con MySQL.

1. Regístrate en [TiDB Cloud](https://tidbcloud.com/).
2. Crea un clúster **Serverless** (gratuito).
3. Una vez creado, ve a **Connect** y selecciona la opción de conexión estándar o *General*.
4. Se generarán tus credenciales. Obtendrás un host, un usuario, un puerto (generalmente 4000) y deberás crear una contraseña.
5. Estos serán los valores para tus variables `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`.
6. Conéctate a esta base de datos usando DBeaver (usando estas mismas credenciales y puerto) y ejecuta un script para crear tus tablas de SQL, o deja que tu ORM lo haga si tienes migraciones automatizadas.

## Paso 3: Desplegar la API en Render (con Docker)

1. Asegúrate de hacer un `git commit` y `git push` a tu repositorio en GitHub con el **Dockerfile** que hemos creado.
2. Crea una cuenta en [Render.com](https://render.com).
3. Haz clic en **New +** y selecciona **Web Service**.
4. Conecta tu cuenta de GitHub y selecciona el repositorio `GuardianOfTheMising`.
5. En la configuración del servicio:
   - **Name:** guardian-api
   - **Environment:** Docker
   - **Branch:** main (o master)
   - **Instance Type:** Free (Gratis)
6. Ve hacia abajo a la sección **Advanced** y haz clic en **Add Environment Variable**. Debes añadir TODAS las variables de entorno de tu archivo `.env.example`, pero con los valores REALES obtenidos en los pasos 1 y 2:
   - `MONGO_URI` = mongodb+srv://...
   - `MONGO_DB_NAME` = (ej. guardian_geo)
   - `MYSQL_HOST` = (tu host de TiDB)
   - `MYSQL_PORT` = (tu puerto de TiDB, ej. 4000)
   - `MYSQL_USER` = (tu usuario de TiDB)
   - `MYSQL_PASSWORD` = (tu contraseña de TiDB)
   - `MYSQL_DB` = (nombre de tu DB, ej. guardian)
7. Haz clic en **Create Web Service**.

## Paso 4: Finalización y Certificado SSL

Render comenzará automáticamente a clonar tu código, construir la imagen de Docker usando tu `Dockerfile` y a instalar tus librerías.
- El proceso puede tardar unos 5 a 10 minutos.
- Una vez que la consola muestre *“Your service is live 🎉”*, se te asignará un dominio estilo `https://guardian-api.onrender.com`.
- **Render te provee el certificado SSL (HTTPS) de forma completamente gratuita y automática**.

¡Tu API estará lista y accesible en línea conectada a tus dos bases de datos gratuitas en la nube!
