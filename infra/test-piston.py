import json
import urllib.request

code = """import os, glob
print('exists:', os.path.exists('/piston/datasets'))
try:
    print('ls:', os.listdir('/piston/datasets'))
except Exception as e:
    print('err:', e)
print('cwd:', os.getcwd())
print('glob:', glob.glob('/piston/datasets/*.csv'))
"""

payload = json.dumps({
    "language": "python",
    "version": "3.10.0",
    "files": [{"name": "test.py", "content": code}]
})

req = urllib.request.Request(
    "http://172.18.0.2:2000/api/v2/execute",
    data=payload.encode(),
    headers={"Content-Type": "application/json"}
)
resp = urllib.request.urlopen(req).read().decode()
print(resp)
