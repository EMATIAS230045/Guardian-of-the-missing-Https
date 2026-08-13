import os

filepath = r"c:\Users\garci\Desktop\GuardianOfTheMising\frontend\android\app\index.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ("ContraseÃ±a", "Contraseña"),
    ("sesiÃ³n", "sesión"),
    ("sesiÃ³n", "sesión"),
    ("RecuperaciÃ³n", "Recuperación"),
    ("AquÃ­", "Aquí"),
    ("enviarÃ­a", "enviaría"),
    ("Â¿", "¿"),
    ("Â¡", "¡")
]

for bad, good in replacements:
    content = content.replace(bad, good)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed index.tsx")
