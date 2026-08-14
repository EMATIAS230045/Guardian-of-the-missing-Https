# utils/security.py
import hashlib

def hash_pin(pin: str) -> str:
    """Calcula el hash SHA-256 de un PIN ingresado."""
    return hashlib.sha256(pin.encode('utf-8')).hexdigest()

def verificar_pin(pin_ingresado: str, pin_guardado_hash: str) -> bool:
    """Verifica si el hash del PIN ingresado coincide con el almacenado."""
    return hash_pin(pin_ingresado) == pin_guardado_hash