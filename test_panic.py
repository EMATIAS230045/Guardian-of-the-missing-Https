import urllib.request
import urllib.error
import json

url = 'http://localhost:8000/alertas/panico'
data = json.dumps({
    'id_usuario': 1,
    'latitud': 19.4326,
    'longitud': -99.1332,
    'id_geocerca_mongo': 'dummy'
}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.getcode()}")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except urllib.error.URLError as e:
    print(f"URL Error: {e.reason}")
