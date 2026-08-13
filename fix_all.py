import os

replacements = {
    "Ã¡": "á", "Ã©": "é", "Ã­": "í", "Ã³": "ó", "Ãº": "ú",
    "Ã±": "ñ", "Â¿": "¿", "Â¡": "¡", "Ã": "í"
}

def fix_all(dirpath):
    for root, dirs, files in os.walk(dirpath):
        for f in files:
            if f.endswith(('.tsx', '.ts')):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                original = content
                for k, v in replacements.items():
                    content = content.replace(k, v)
                
                if original != content:
                    with open(path, 'w', encoding='utf-8') as file:
                        file.write(content)
                    print(f"Fixed encoding in {path}")

fix_all(r"c:\Users\garci\Desktop\GuardianOfTheMising\frontend\android\app")
