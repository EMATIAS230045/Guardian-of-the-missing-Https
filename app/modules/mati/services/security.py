import hashlib
import hmac

def verificar_pin(pin_texto_plano: str, pin_hashed: str) -> bool:
    """
    Calcula el hash SHA-256 del PIN ingresado y lo compara con el guardado en la BD.
    """
    # Generamos el hash del PIN que ingresó el usuario
    hash_calculado = hashlib.sha256(pin_texto_plano.encode("utf-8")).hexdigest()
    
    # Comparamos de forma segura ambas cadenas de texto
    return hmac.compare_digest(hash_calculado, pin_hashed)