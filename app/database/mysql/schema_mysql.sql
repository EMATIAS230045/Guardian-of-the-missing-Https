-- =====================================================================
-- GuardianOfTheMising - Esquema MySQL (version DEMO / recortada)
-- Autor: Jose Arturo Garcia Gonzalez (230629) - Diseño y Estructura de BD
-- Motor: MySQL 8.x
-- Solo lo indispensable para la simulacion: Usuarios+Roles, Dispositivos,
-- Alertas, ContactosEmergencia, Evidencias. Geocercas y Ubicaciones viven en
-- MongoDB (ver setup_mongo.js).
-- =====================================================================

CREATE DATABASE IF NOT EXISTS guardian_of_the_missing
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE guardian_of_the_missing;

-- ---------------------------------------------------------------------
-- 1. Roles (catálogo)
-- ---------------------------------------------------------------------
CREATE TABLE Roles (
    id_rol      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol  VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 'Administrador' es usado por el administrador gubernamental (acceso a datos sensibles)
INSERT INTO Roles (nombre_rol) VALUES ('Administrador'), ('Usuario'), ('Mantenimiento');

-- ---------------------------------------------------------------------
-- 2. Usuarios
-- ---------------------------------------------------------------------
CREATE TABLE Usuarios (
    id_usuario          INT AUTO_INCREMENT PRIMARY KEY,
    nombre              VARCHAR(50) NOT NULL,
    apellido_paterno    VARCHAR(50) NOT NULL,
    apellido_materno    VARCHAR(50) NULL,
    correo              VARCHAR(100) NOT NULL UNIQUE,
    contrasena_hash     VARCHAR(255) NOT NULL,
    telefono            VARCHAR(20) NULL,
    fecha_nacimiento    DATE NULL,
    tipo_sangre         ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NULL,
    pin_cancelacion     VARCHAR(255) NULL,
    max_intentos_pin    INT NULL DEFAULT 3,
    id_rol              INT NOT NULL,
    activo              TINYINT(1) NOT NULL DEFAULT 1,
    fecha_registro      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_rol
        FOREIGN KEY (id_rol) REFERENCES Roles(id_rol)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_usuarios_correo ON Usuarios(correo);

-- ---------------------------------------------------------------------
-- 2.1 Dispositivos
--     id_dispositivo_vinculado: si este renglon es un wearos, aqui va
--     el id_dispositivo del celular Android con el que esta emparejado.
--     Asi el backend sabe a donde reenviar/notificar cuando el boton de
--     panico se presiona desde el reloj (que normalmente no tiene camara
--     para la evidencia, esa parte la hace el celular vinculado).
-- ---------------------------------------------------------------------
CREATE TABLE Dispositivos (
    id_dispositivo            INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario                INT NOT NULL,
    tipo_dispositivo          ENUM('android','wearos') NOT NULL,
    token_fcm                 VARCHAR(255) NULL COMMENT 'Token push de Firebase, para saber donde mandar la alerta',
    modelo                    VARCHAR(100) NULL,
    id_dispositivo_vinculado  INT NULL COMMENT 'Solo aplica si tipo_dispositivo=wearos: el id_dispositivo del celular emparejado',
    activo                    TINYINT(1) NOT NULL DEFAULT 1,
    fecha_registro            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion           DATETIME NULL,
    CONSTRAINT fk_dispositivos_usuario
        FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_dispositivos_vinculado
        FOREIGN KEY (id_dispositivo_vinculado) REFERENCES Dispositivos(id_dispositivo)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_dispositivos_usuario ON Dispositivos(id_usuario);

-- ---------------------------------------------------------------------
-- 3. ContactosEmergencia
-- ---------------------------------------------------------------------
CREATE TABLE ContactosEmergencia (
    id_contacto     INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario      INT NOT NULL,
    nombre          VARCHAR(100) NOT NULL,
    telefono        VARCHAR(20) NOT NULL,
    correo          VARCHAR(100) NULL,
    parentesco      VARCHAR(50) NULL,
    prioridad       INT NOT NULL DEFAULT 1,
    fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contactos_usuario
        FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. (Geocercas vive en MongoDB - coleccion "geocercas". Ver setup_mongo.js)
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 5. Alertas
--    id_geocerca_mongo: NULL = boton de panico manual
--                       con valor = disparada por una geocerca (Mongo)
-- ---------------------------------------------------------------------
CREATE TABLE Alertas (
    id_alerta          INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario         INT NOT NULL,
    id_dispositivo     INT NULL COMMENT 'Desde que dispositivo se disparo (reloj o celular)',
    id_geocerca_mongo  CHAR(24) NULL COMMENT 'ObjectId de la geocerca en MongoDB. Sin FK real: se valida en el backend.',
    latitud            DECIMAL(10,7) NOT NULL,
    longitud           DECIMAL(10,7) NOT NULL,
    fecha_hora         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado             ENUM('activa','atendida','cancelada','falsa_alarma') NOT NULL DEFAULT 'activa',
    nivel_riesgo       ENUM('baja','media','alta') NOT NULL DEFAULT 'media',
    comentario         VARCHAR(255) NULL,
    intentos_fallidos  INT NOT NULL DEFAULT 0,
    ultimo_intento_fallido DATETIME NULL,
    CONSTRAINT fk_alertas_usuario
        FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_alertas_dispositivo
        FOREIGN KEY (id_dispositivo) REFERENCES Dispositivos(id_dispositivo)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_alertas_usuario_fecha ON Alertas(id_usuario, fecha_hora);

-- ---------------------------------------------------------------------
-- 6. (Ubicaciones vive en MongoDB - coleccion "ubicaciones". Ver setup_mongo.js)
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 7. Evidencias (foto / audio ligados a una alerta)
-- ---------------------------------------------------------------------
CREATE TABLE Evidencias (
    id_evidencia    INT AUTO_INCREMENT PRIMARY KEY,
    id_alerta       INT NOT NULL,
    tipo_evidencia  ENUM('foto','audio') NOT NULL,
    url_archivo     VARCHAR(255) NOT NULL,
    latitud         DECIMAL(10,7) NULL,
    longitud        DECIMAL(10,7) NULL,
    fecha_hora      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidencias_alerta
        FOREIGN KEY (id_alerta) REFERENCES Alertas(id_alerta)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. TokensBloqueados (Para invalidacion de sesiones JWT)
-- ---------------------------------------------------------------------
CREATE TABLE TokensBloqueados (
    id_token        INT AUTO_INCREMENT PRIMARY KEY,
    token           VARCHAR(500) NOT NULL UNIQUE,
    fecha_bloqueo   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_tokens_bloqueados_token ON TokensBloqueados(token);

-- =====================================================================
-- Fin del script (version demo: 4 tablas en MySQL + 2 colecciones Mongo)
-- =====================================================================
