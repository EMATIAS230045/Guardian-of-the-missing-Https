from datetime import date, datetime, timezone
from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship
from pydantic import EmailStr, field_validator, BaseModel
from enum import Enum

# --- ENUMS ---
class EstadoAlerta(str, Enum):
    activa = "activa"
    atendida = "atendida"
    cancelada = "cancelada"
    falsa_alarma = "falsa_alarma"
    ESPERANDO_PIN = "ESPERANDO_PIN"

class NivelRiesgo(str, Enum):
    # Valores en minúsculas para coincidir con el esquema y la BD
    bajo = "bajo"
    medio = "medio"
    alto = "alto"

class TipoDispositivo(str, Enum):
    android = "android"
    wearos = "wearos"

class TipoEvidencia(str, Enum):
    foto = "foto"
    audio = "audio"

class TipoSangre(str, Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"

# --- TABLAS ---

class Rol(SQLModel, table=True):
    __tablename__ = "Roles"

    id_rol: Optional[int] = Field(default=None, primary_key=True)
    nombre_rol: str = Field(max_length=30, nullable=False, unique=True)

    usuarios: List["Usuario"] = Relationship(back_populates="rol")

class Usuario(SQLModel, table=True):
    __tablename__ = "Usuarios"

    id_usuario: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50, nullable=False)
    apellido_paterno: str = Field(max_length=50, nullable=False)
    apellido_materno: Optional[str] = Field(default=None, max_length=50)
    correo: str = Field(max_length=100, index=True, unique=True, nullable=False)
    contrasena_hash: str = Field(max_length=255, nullable=False)
    telefono: Optional[str] = Field(default=None, max_length=20)
    fecha_nacimiento: Optional[date] = Field(default=None)
    tipo_sangre: Optional[str] = Field(default=None)
    pin_cancelacion: Optional[str] = Field(default=None, max_length=255)
    max_intentos_pin: Optional[int] = Field(default=3)
    
    id_rol: int = Field(default=2, foreign_key="Roles.id_rol", nullable=False) # 2 = Usuario
    activo: bool = Field(default=True, nullable=False)
    fecha_registro: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    rol: Optional[Rol] = Relationship(back_populates="usuarios")
    contactos: List["ContactoEmergencia"] = Relationship(back_populates="usuario")
    dispositivos: List["Dispositivo"] = Relationship(back_populates="usuario")
    alertas: List["Alerta"] = Relationship(back_populates="usuario")

class Dispositivo(SQLModel, table=True):
    __tablename__ = "Dispositivos"
    
    id_dispositivo: Optional[int] = Field(default=None, primary_key=True)
    id_usuario: int = Field(foreign_key="Usuarios.id_usuario", nullable=False)
    tipo_dispositivo: TipoDispositivo = Field(nullable=False)
    token_fcm: Optional[str] = Field(default=None, max_length=255)
    modelo: Optional[str] = Field(default=None, max_length=100)
    id_dispositivo_vinculado: Optional[int] = Field(default=None, foreign_key="Dispositivos.id_dispositivo")
    activo: bool = Field(default=True, nullable=False)
    fecha_registro: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    ultima_conexion: Optional[datetime] = None

    usuario: Optional[Usuario] = Relationship(back_populates="dispositivos")

class ContactoEmergencia(SQLModel, table=True):
    __tablename__ = "ContactosEmergencia"

    id_contacto: Optional[int] = Field(default=None, primary_key=True)
    id_usuario: int = Field(foreign_key="Usuarios.id_usuario", nullable=False)
    nombre: str = Field(max_length=100, nullable=False)
    telefono: str = Field(max_length=20, nullable=False)
    correo: Optional[str] = Field(default=None, max_length=100)
    parentesco: Optional[str] = Field(default=None, max_length=50)
    prioridad: int = Field(default=1, nullable=False)
    fecha_registro: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    usuario: Optional[Usuario] = Relationship(back_populates="contactos")

class Alerta(SQLModel, table=True):
    __tablename__ = "Alertas"
    
    id_alerta: Optional[int] = Field(default=None, primary_key=True)
    id_usuario: int = Field(foreign_key="Usuarios.id_usuario", nullable=False)
    id_dispositivo: Optional[int] = Field(foreign_key="Dispositivos.id_dispositivo", default=None)
    id_geocerca_mongo: Optional[str] = Field(default=None, max_length=24) 
    latitud: float = Field(nullable=False)
    longitud: float = Field(nullable=False)
    fecha_hora: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    estado: EstadoAlerta = Field(default=EstadoAlerta.activa, nullable=False)
    nivel_riesgo: NivelRiesgo = Field(default=NivelRiesgo.alto, nullable=False)
    comentario: Optional[str] = Field(default=None, max_length=255)
    intentos_fallidos: int = Field(default=0, nullable=False)
    ultimo_intento_fallido: Optional[datetime] = None

    usuario: Optional[Usuario] = Relationship(back_populates="alertas")
    evidencias: List["Evidencia"] = Relationship(back_populates="alerta")

class Evidencia(SQLModel, table=True):
    __tablename__ = "Evidencias"
    
    id_evidencia: Optional[int] = Field(default=None, primary_key=True)
    id_alerta: int = Field(foreign_key="Alertas.id_alerta", nullable=False)
    tipo_evidencia: TipoEvidencia = Field(nullable=False)
    url_archivo: str = Field(max_length=255, nullable=False) 
    latitud: Optional[Decimal] = Field(default=None, max_digits=10, decimal_places=7)
    longitud: Optional[Decimal] = Field(default=None, max_digits=10, decimal_places=7)
    fecha_hora: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    alerta: Optional[Alerta] = Relationship(back_populates="evidencias")

class TokenBloqueado(SQLModel, table=True):
    __tablename__ = "TokensBloqueados"

    id_token: Optional[int] = Field(default=None, primary_key=True)
    token: str = Field(max_length=500, unique=True, index=True, nullable=False)
    fecha_bloqueo: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

# ==========================================
# ESQUEMAS (DTOs) PARA FASTAPI
# ==========================================

class UsuarioCreate(SQLModel):
    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    correo: EmailStr
    contrasena: str
    telefono: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    tipo_sangre: Optional[TipoSangre] = None

    @field_validator('correo')
    @classmethod
    def sanitizar_correo(cls, v: str) -> str:
        return v.lower().strip()

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido_paterno: Optional[str] = None
    apellido_materno: Optional[str] = None
    correo: Optional[EmailStr] = None
    contrasena: Optional[str] = None
    telefono: Optional[str] = None
    tipo_sangre: Optional[TipoSangre] = None

class UsuarioResponse(SQLModel):
    id_usuario: int
    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    correo: str
    telefono: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    tipo_sangre: Optional[TipoSangre] = None
    id_rol: int
    activo: bool
    fecha_registro: datetime

class LoginRequest(SQLModel):
    correo: EmailStr
    contrasena: str

class TokenResponse(SQLModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class ContactoEmergenciaCreate(SQLModel):
    nombre: str
    telefono: str
    correo: Optional[EmailStr] = None
    parentesco: Optional[str] = None
    prioridad: int = 1

class ContactoEmergenciaUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[EmailStr] = None
    parentesco: Optional[str] = None
    prioridad: Optional[int] = None

class ContactoEmergenciaResponse(SQLModel):
    id_contacto: int
    id_usuario: int
    nombre: str
    telefono: str
    correo: Optional[str] = None
    parentesco: Optional[str] = None
    prioridad: int
    fecha_registro: datetime
