#!/bin/bash
set -e

# Piston container IP (Docker internal network)
PISTON_IP=172.18.0.2
PISTON=http://$PISTON_IP:2000/api/v2

# Step 1: Remove the conflicting datasets dir that blocks python install
echo "=== Removing conflicting datasets dir ==="
docker exec devcapsules_piston rm -rf /piston/packages/python
echo "Done"

# Step 2: Save datasets from Docker image to host /tmp
echo "=== Extracting datasets from Docker image ==="
docker create --name temp_csv devcapsulesacr.azurecr.io/devcapsules-piston:latest true
docker cp temp_csv:/piston/packages/python/3.10.0/datasets /tmp/piston_datasets
docker rm temp_csv
ls -la /tmp/piston_datasets/
echo "Done"

# Step 3: Install runtimes via API
install_pkg() {
  echo "Installing $1 $2..."
  python3 << PYEOF
import urllib.request, json
data = json.dumps({"language": "$1", "version": "$2"}).encode()
req = urllib.request.Request("$PISTON/packages", data=data, headers={"Content-Type": "application/json"})
try:
    resp = urllib.request.urlopen(req, timeout=600)
    print(resp.read().decode())
except Exception as e:
    print(f"Error: {e}")
PYEOF
}

install_pkg python 3.10.0
install_pkg node 18.15.0
install_pkg java 15.0.2
install_pkg gcc 10.2.0

# Step 4: Copy datasets back into the volume (now alongside Python runtime)
echo "=== Copying datasets into Python runtime ==="
docker cp /tmp/piston_datasets devcapsules_piston:/piston/packages/python/3.10.0/datasets
docker exec devcapsules_piston chmod -R 444 /piston/packages/python/3.10.0/datasets/
docker exec devcapsules_piston chmod 555 /piston/packages/python/3.10.0/datasets
echo "Done"

# Step 5: Install pandas/numpy
echo "=== Installing pandas and numpy ==="
python3 << PYEOF
import urllib.request, json
code = "import subprocess, sys; subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pandas', 'numpy', '--quiet'])"
data = json.dumps({"language": "python", "version": "3.10.0", "files": [{"name": "install.py", "content": code}], "run_timeout": 120000}).encode()
req = urllib.request.Request("$PISTON/execute", data=data, headers={"Content-Type": "application/json"})
try:
    resp = urllib.request.urlopen(req, timeout=300)
    print(resp.read().decode())
except Exception as e:
    print(f"Error: {e}")
PYEOF

# Step 6: Verify
echo "=== Installed runtimes ==="
python3 << PYEOF
import urllib.request
req = urllib.request.Request("$PISTON/runtimes")
print(urllib.request.urlopen(req).read().decode())
PYEOF

echo "=== Verify datasets ==="
docker exec devcapsules_piston ls -la /piston/packages/python/3.10.0/datasets/

echo "=== ALL DONE ==="
