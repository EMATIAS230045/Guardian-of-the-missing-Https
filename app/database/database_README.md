# app/database

Arquitectura híbrida: dos motores, cada quien con su carpeta.

- **mysql/** — `schema_mysql.sql`. Roles, Usuarios, Dispositivos, ContactosEmergencia, Alertas, Evidencias, TokensBloqueados.
  Datos con relaciones fuertes (FK real).
  *Nota: Se agregó `TokensBloqueados` para manejo de sesiones JWT, y columnas de intentos fallidos en `Alertas` (aprobado por BD/Documentación).*
- **mongo/** — `setup_mongo.js`. Colecciones `geocercas` y `ubicaciones`.
  Escritura de alta frecuencia + índice geoespacial `2dsphere`. Sin FK real hacia MySQL
  (la referencia es lógica vía `id_usuario` / `id_geocerca_mongo`, se valida en el backend).

Diccionario de datos completo (campos, tipos, normalización): rama `documentation`, carpeta `docs/`.


