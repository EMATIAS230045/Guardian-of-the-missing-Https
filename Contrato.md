## 1. Módulo de Gestión de Identidades y Seguridad (IAM)

**Objetivo**
Resolver de forma unificada la seguridad perimetral de la API, garantizando que todos los actores (usuarios móviles, administradores y dispositivos) estén autenticados, y que las operaciones se ejecuten dentro de los roles autorizados.

**Responsabilidad**
Administrar de manera exclusiva el ciclo de vida de las identidades de usuario, el cifrado criptográfico de contraseñas y la emisión, validación e invalidación de tokens de acceso Bearer (JWT) sin estado.

**Funcionalidades que agrupa**
* Registro de Cuentas de Usuarios (Web, Mobile)
* Inicio de Sesión y Autenticación (Web, Mobile)
* Vinculación y Emparejamiento Seguro de Smartwatches (Mobile, Smartwatch)
* Recuperación de Contraseñas y Reinicio de Sesión (Web, Mobile)

**Servicios o casos de uso del módulo**
* **Registrar Cuenta:** Inserta credenciales y datos básicos del usuario de forma segura.
* **Autenticar Credenciales:** Verifica combinaciones de usuario/contraseña.
* **Emitir Token JWT:** Genera tokens firmados con claims de expiración y rol.
* **Validar Token en Middleware:** Intercepta cabeceras HTTP para validar tokens sobre la marcha.
* **Revocar Sesión:** Invalida tokens temporalmente (Blacklist en caché).

**Datos que recibe (Inputs)**
* Credenciales del usuario (email, password_hash).
* Metadatos del dispositivo para vinculación.
* Parámetros del perfil del rol solicitado.

**Datos que devuelve (Outputs)**
* Token JWT firmado digitalmente.
* Contexto verificado del usuario (user_id, role, is_active).

**Dependencias**
* **Consume:** Ninguno (es una raíz de infraestructura).
* **Consumido por:** Todos los módulos lógicos expuestos al exterior (a través del middleware de validación).

**Plataformas consumidoras**
Web, Mobile, Smartwatch.

**Justificación arquitectónica**
* **SRP:** Se enfoca únicamente en la seguridad de acceso.
* **Alta Cohesión:** Concentra la lógica criptográfica y de firmas digitales, permitiendo reemplazar el proveedor de firmas o el algoritmo de hash de contraseñas de forma aislada sin afectar el resto del sistema.

---

## 2. Módulo de Directorio y Relaciones de Usuario (Directory & Relations)

**Objetivo**
Soportar la base de datos de usuarios y organizar su red primaria de seguridad mediante contactos de confianza.

**Responsabilidad**
Gestionar de manera integral los metadatos de los perfiles de usuario y las operaciones transaccionales CRUD asociadas a sus redes de contactos de emergencia.

**Funcionalidades que agrupa**
* Administración de Datos del Perfil de Usuario (Mobile)
* Búsqueda y Visualización de Usuarios Registrados (Web)
* Control de Estados de Cuenta Activo/Bloqueado (Web)
* CRUD Completo de la Red de Contactos de Confianza (Web, Mobile)

**Servicios o casos de uso del módulo**
* **Actualizar Perfil:** Modifica datos del usuario (teléfono, nombre, código PIN de seguridad).
* **Crear Contacto de Confianza:** Registra un nuevo contacto asignando teléfono, correo y token FCM de destino.
* **Modificar Contacto:** Actualiza campos de un contacto del usuario.
* **Obtener Directorio:** Recupera los contactos asociados a un usuario específico.
* **Eliminar Contacto:** Quita una relación del directorio de un usuario.

**Datos que recibe (Inputs)**
* Parámetros de modificación de perfil.
* Estructura del contacto (name, phone, email, fcm_token).

**Datos que devuelve (Outputs)**
* Metadata del perfil actualizado.
* Listados de contactos ordenados por jerarquía de notificación.

**Dependencias**
* **Consume:** Módulo IAM (para validar la pertenencia del recurso).
* **Consumido por:** Módulo de Alertas (para recuperar la red de notificación en caso de emergencia).

**Plataformas consumidoras**
Web, Mobile.

**Justificación arquitectónica**
* **Mantenibilidad y Reutilización:** Los datos de contacto no cambian constantemente ni tienen requisitos de latencia en milisegundos como el GPS. Separar estas funciones transaccionales estándar previene que la manipulación de perfiles impacte el canal de emergencia activa.

---

## 3. Módulo de Ingesta y Telemetría de Ubicación (GPS Telemetry)

**Objetivo**
Procesar masivamente y sin interrupciones los flujos continuos de localización geográfica provenientes de múltiples dispositivos concurrentes en tiempo real.

**Responsabilidad**
Recibir, validar la estructura matemática y almacenar de forma optimizada el historial temporal y espacial de coordenadas GPS transmitidas por los terminales cliente.

**Funcionalidades que agrupa**
* Transmisión de Coordenadas GPS en Segundo Plano (Mobile)
* Sincronización Periódica de Telemetría (Smartwatch)
* Historial de Desplazamiento y Rutas (Web, Mobile)

**Servicios o casos de uso del módulo**
* **Ingestar Coordenada:** Endpoint de alta velocidad que almacena latitud, longitud, altitud y marcas de tiempo del GPS.
* **Obtener Última Ubicación:** Consulta ultra-rápida de la coordenada más reciente de un usuario.
* **Recuperar Historial de Trayectorias:** Devuelve la lista de puntos espaciales ordenados en un intervalo temporal específico.

**Datos que recibe (Inputs)**
* Payload JSON/Protocol Buffers con la telemetría (latitude, longitude, timestamp, accuracy_meters).

**Datos que devuelve (Outputs)**
* Historial de trayectorias filtradas por tiempo.
* Coordenadas geográficas puntuales más recientes.

**Dependencias**
* **Consume:** Módulo IAM.
* **Consumido por:** Módulo de Análisis Geoespacial, Módulo de Alertas, Módulo de Dashboard.

**Plataformas consumidoras**
Mobile, Smartwatch, Procesos automáticos de análisis.

**Justificación arquitectónica**
* **Escalabilidad:** Al ser el módulo con mayor tasa de peticiones por segundo de la plataforma, requiere aislamiento absoluto para que sus escrituras concurrentes en base de datos no bloqueen el servidor web principal.

---

## 4. Módulo de Análisis Geoespacial y Geocercas Inteligentes (Spatial Analytics)

**Objetivo**
Prevenir de forma automática situaciones de riesgo calculando límites seguros y detectando zonas geográficas con alta concentración delictiva.

**Responsabilidad**
Gobernar la creación de geocercas manuales y automatizar por completo la delimitación de zonas de riesgo espacial mediante la ejecución asíncrona de algoritmos de agrupamiento basados en densidad (DBSCAN) sobre el histórico de incidentes reportados.

**Funcionalidades que agrupa**
* Configuración Manual de Geocercas Seguras (Mobile, Web) – (Admin Gob)
* Generación Automática de Geocercas de Peligro mediante Análisis de Incidentes (Procesos automáticos)
* Detección de Entrada, Salida y Proximidad de Zonas Seguras/Riesgo (Mobile, Smartwatch)
* Visualización de Capas de Mapas de Calor de Delito (Web)
* Actualización del mapa en tiempo real a través de web sockets

**Servicios o casos de uso del módulo**
* **Definir Geocerca Segura:** Almacena límites espaciales estáticos parametrizados por el usuario.
* **Ejecutar Clustering de Peligro:** Proceso en lote que aplica algoritmos DBSCAN para generar zonas de peligro de manera autónoma.
* **Evaluar Punto en Geocerca:** Compara una coordenada de telemetría entrante contra los perímetros activos del usuario.
* **Obtener Hotspots Activos:** Recupera áreas poligonales de riesgo consolidadas por el algoritmo.

**Datos que recibe (Inputs)**
* Métricas de configuración del algoritmo DBSCAN: radio de búsqueda $\epsilon$ y mínimo de puntos por clúster $\text{MinPts}$.
* Historial acumulado de coordenadas de incidentes activos o pasados.
* Peticiones de verificación de coordenadas del usuario.

**Datos que devuelve (Outputs)**
* Registros de geocercas automáticas de tipo "danger".
* Alertas de transiciones geográficas confirmadas ("breach_detected").

**Dependencias**
* **Consume:** Módulo de Telemetría GPS, Módulo de Alertas (para extraer el histórico de incidentes).
* **Consumido por:** Módulo de Alertas (para activar flujos preventivos al detectar transiciones fuera de rangos de seguridad).

**Plataformas consumidoras**
Web, Mobile, Smartwatch, Procesos automáticos (cronógrafos del sistema).

**Justificación arquitectónica**
* **Aislamiento de Recursos:** El cálculo de densidad espacial y clustering en el servidor con volúmenes masivos de datos es CPU-bound. Aislarlo evita que el análisis matemático degrade la latencia del API Gateway del BackEnd.

---

## 5. Módulo de Orquestación de Alertas y Emergencias (Emergency & Alerter)

**Objetivo**
Centralizar y coordinar las acciones críticas del sistema durante un incidente de seguridad de alta prioridad para minimizar los tiempos de respuesta.

**Responsabilidad**
Orquestar la máquina de estados de las emergencias de los usuarios, gestionando desde el inicio del pánico hasta su resolución definitiva, y consolidando los enlaces temporales de seguimiento activo.

**Funcionalidades que agrupa**
* Activación del Botón de Pánico (Mobile, Smartwatch)
* Cancelación de Emergencia mediante Código PIN (Mobile)
* Consola de Incidentes y Rastreo en Vivo (Web)
* Historial General de Alertas y Eventos (Web, Mobile)

**Servicios o casos de uso del módulo**
* **Iniciar Emergencia:** Abre una sesión crítica para el usuario y congela su estado general.
* **Finalizar Emergencia:** Cierra el incidente previa validación del PIN del usuario.
* **Obtener Estado de Incidentes Activos:** Recupera de la base de datos la lista de incidentes que requieren atención inmediata.
* **Generar Sesión de Seguimiento:** Construye un contexto de incidente seguro vinculable con servicios externos de notificaciones.

**Datos que recibe (Inputs)**
* Petición de pánico con coordenada inicial y marca temporal.
* Código PIN de desactivación.
* ID del incidente para consulta.

**Datos que devuelve (Outputs)**
* Registro del incidente activo.
* Estado final y bitácora de auditoría de la alerta.

**Dependencias**
* **Consume:** Módulo de Directorio y Relaciones de Usuario, Módulo de Telemetría GPS.
* **Consumido por:** Módulo de Evidencias, Módulo de Notificaciones.

**Plataformas consumidoras**
Web, Mobile, Smartwatch.

**Justificación arquitectónica**
* **Bajo Acoplamiento y SLA Crítico:** Este módulo cuenta con el Acuerdo de Nivel de Servicio (SLA) más alto del sistema. Debe ser completamente independiente para evitar retrasos y caídas causadas por anomalías en otros componentes no urgentes del BackEnd.

---

## 6. Módulo de Gestión de Evidencia Forense (Evidence Vault)

**Objetivo**
Garantizar la recolección íntegra de archivos multimedia recolectados por los dispositivos del usuario durante un incidente de seguridad.

**Responsabilidad**
Procesar cargas de datos pesados de flujos multimedia (audio, fotos) transmitidos de forma síncrona o asíncrona, estructurando estos binarios con marcas de tiempo verificadas e integrándolos directamente con el ID del incidente de pánico activo.

**Funcionalidades que agrupa**
* Captura y Envío Silencioso de Grabación de Audio (Mobile)
* Captura y Envío de Evidencia Fotográfica (Mobile)
* Consolidación de Evidencia y Metadata del Incidente (Web, Mobile): Audio, Ubicación.

**Servicios o casos de uso del módulo**
* **Almacenar Archivo de Evidencia:** Procesa el envío en formato multipart para validar y depositar binarios en el almacenamiento del sistema.
* **Extraer Metadatos Forenses:** Asocia geolocalización de procedencia de captura y marcas temporales inalterables al recurso cargado.
* **Recuperar Evidencias del Incidente:** Entrega los enlaces de descarga segura o reproducción de los audios y fotos de una emergencia específica.

**Datos que recibe (Inputs)**
* Flujo de archivos binarios (wav, jpeg).
* Metadatos asociados (alert_id, timestamp, capture_coordinates).

**Datos que devuelve (Outputs)**
* Rutas URL seguras (URIs) del recurso almacenado.
* Firma criptográfica de verificación de integridad del archivo.

**Dependencias**
* **Consume:** Módulo de Alertas (para comprobar si existe un incidente activo donde anexar los archivos).
* **Consumido por:** Módulo de Analítica y Dashboard (Web) para despliegue de evidencia.

**Plataformas consumidoras**
Mobile, Web.

**Justificación arquitectónica**
* **Separación de I/O de Red:** El procesamiento de archivos multimedia pesados consume un ancho de banda considerable. Al aislar este dominio de negocio, se previene que las conexiones persistentes de carga de imágenes saturen los hilos de atención rápidos encargados de recibir la telemetría y alertas vitales.

---

## 7. Módulo de Notificaciones y Comunicaciones en Tiempo Real (Notification Gate)

**Objetivo**
Establecer un canal centralizado y abstracto para el envío instantáneo de mensajes y datos en vivo a todos los clientes del ecosistema.

**Responsabilidad**
Unificar e instrumentar los proveedores externos de mensajería descendente (Firebase Cloud Messaging - FCM) y mantener activas las sesiones WebSocket para la transmisión de telemetría reactiva en el panel de control web.

**Funcionalidades que agrupa**
* Envío de Notificaciones Push Prioritarias de Alerta (Mobile, Smartwatch)
* Recepción de Notificaciones de Brecha de Geocerca (Mobile, Smartwatch)
* Actualización en Tiempo Real de Mapas Administrativos (Web)

**Servicios o casos de uso del módulo**
* **Despachar Notificación Push:** Envía peticiones prioritarias a FCM dirigidas a tokens de contactos.
* **Sostener Canal WebSocket:** Administra conexiones HTTP persistentes para enviar actualizaciones de incidentes a la consola web.
* **Transmitir Alerta en Vivo:** Difunde telemetría activa a los sockets conectados en el panel Angular sin necesidad de refresco.

**Datos que recibe (Inputs)**
* Payload de la notificación (title, body, priority, target_fcm_tokens).
* Flujo JSON de coordenadas activas del usuario en peligro.

**Datos que devuelve (Outputs)**
* Id de transacciones de envío FCM.
* Transmisión fluida por socket de eventos activos.

**Dependencias**
* **Consume:** Módulo IAM (para validar tokens antes de permitir conexiones WebSocket).
* **Consumido por:** Módulo de Alertas, Módulo de Análisis Geoespacial.

**Plataformas consumidoras**
Web, Mobile, Smartwatch, Procesos internos.

**Justificación arquitectónica**
* **Abstracción y Reutilización:** Evita que módulos como Alertas o Geocercas tengan código acoplado con las APIs propietarias de Google Firebase o la librería de WebSockets, permitiendo cambiar el proveedor de mensajería (ej: transicionar a OneSignal o AWS SNS) de manera transparente.

---

## 8. Módulo de Analítica, Dashboard y Estadísticas (Dashboard & Analytics)

**Objetivo**
Facilitar la toma de decisiones estratégicas a nivel administrativo mediante la presentación agregada e inteligente del comportamiento del sistema.

**Responsabilidad**
Procesar consultas complejas de agregación sobre el histórico de datos de incidentes, usuarios y telemetría histórica, para generar resúmenes estadísticos que alimenten el panel de control web.

**Funcionalidades que agrupa**
* Panel Administrativo de Visualización de Incidentes (Web)
* Métricas Estadísticas del Comportamiento de Emergencias (Web)
* Reportes de Rendimiento y Logs de Auditoría del Ecosistema (Web)

**Servicios o casos de uso del módulo**
* **Generar Resumen Estadístico:** Calcula métricas clave de desempeño (KPIs) como tiempos promedio de respuesta de alerta, zonas calientes históricas y tasas de registro mensual.
* **Consultar Logs de Sistema:** Permite consultar registros de auditoría operativa para fines de depuración y soporte.

**Datos que recibe (Inputs)**
* Filtros de consulta (intervalos de fechas, zonas de búsqueda, tipo de rol).

**Datos que devuelve (Outputs)**
* Colecciones de datos agregadas preparadas para visualización en formato JSON (matrices de gráficos de barras, distribuciones geográficas).

**Dependencias**
* **Consume:** Módulo de Telemetría GPS, Módulo de Alertas.
* **Consumido por:** Ninguno (es consumidor final de datos).

**Plataformas consumidoras**
Web, Procesos automáticos (generadores semanales de reportes en PDF).

**Justificación arquitectónica**
* **Aislamiento de Consultas de Lectura Pesada (CQRS parcial):** La lectura y agregación de históricos de millones de registros GPS y alertas puede causar bloqueos en bases de datos relacionales tradicionales como SQL Server si compiten por recursos con las transacciones críticas en tiempo real del botón de pánico.

---

## Análisis Global de la Arquitectura

### 1. Árbol Jerárquico de Módulos (BackEnd)

```text
GuardianOfTheMissing-BackEnd
├── 01_IAM (Gestión de Identidades y Seguridad)
│   ├── Registro
│   ├── Autenticación
│   ├── Validación_JWT
│   └── Emparejamiento_WearOS
├── 02_Directory_And_Relations (Directorio de Cuentas)
│   ├── Gestión_Perfiles
│   └── CRUD_Contactos_Confianza
├── 03_GPS_Telemetry (Ingesta de Localización)
│   ├── Ingesta_Coordenadas_GPS
│   ├── Consulta_Última_Posición
│   └── Consulta_Historial_Trayectorias
├── 04_Spatial_Analytics (Motor de Geocercas Automáticas)
│   ├── CRUD_Zonas_Seguras_Manuales
│   ├── Motor_Clustering_DBSCAN (Análisis de Densidad)
│   └── Algoritmo_Intersección_Punto_Polígono
├── 05_Emergency_And_Alerter (Orquestación de Incidentes)
│   ├── Máquina_Estados_Alerta
│   ├── Activación_Pánico
│   └── Resolución_Emergencia_PIN
├── 06_Evidence_Vault (Almacenamiento Multimedia Forense)
│   ├── Upload_Multipart_Archivos
│   └── Estampado_Metadatos_Forense
├── 07_Notification_Gate (Gateway de Comunicaciones)
│   ├── Broker_FCM_Push
│   └── Gestor_Conexiones_WebSockets
└── 08_Dashboard_And_Analytics (Reportes Administrativos)
    ├── Agregación_Histórica_KPIs
    └── Auditoría_Logs