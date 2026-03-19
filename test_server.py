import urllib.request
import json
import urllib.error

url = "http://localhost:8001/onboarding/step"
data = json.dumps({"step": 1, "data": {}}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SOME_FAKE_TOKEN'
})

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Error Body:", e.read().decode('utf-8'))
except urllib.error.URLError as e:
    print("URL Error:", e.reason)
except Exception as e:
    print("Exception:", e)
