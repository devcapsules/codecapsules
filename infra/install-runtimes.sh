#!/bin/bash
# Install all required runtimes via Piston API
PISTON=http://172.18.0.2:2000/api/v2/packages

install_pkg() {
  echo "Installing $1 $2..."
  python3 -c "
import urllib.request, json
data = json.dumps({'language': '$1', 'version': '$2'}).encode()
req = urllib.request.Request('$PISTON', data=data, headers={'Content-Type': 'application/json'})
try:
    resp = urllib.request.urlopen(req, timeout=300)
    print(resp.read().decode())
except Exception as e:
    print(f'Error: {e}')
"
}

install_pkg python 3.10.0
install_pkg javascript 18.15.0
install_pkg java 15.0.2
install_pkg gcc 10.2.0

echo "=== Installed runtimes ==="
python3 -c "
import urllib.request
req = urllib.request.Request('http://172.18.0.2:2000/api/v2/runtimes')
print(urllib.request.urlopen(req).read().decode())
"
