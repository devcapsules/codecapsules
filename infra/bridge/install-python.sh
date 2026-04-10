#!/bin/bash
# Verify datasets and install pip packages for Piston Python runtime
echo "--- Checking datasets in sandbox ---"
docker exec devcapsules_bridge node -e '
fetch("http://piston:2000/api/v2/execute", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({language: "python", version: "3.10.0", files: [{content: "import os\nfor f in os.listdir(\"/piston/packages/python/3.10.0/datasets/\"): print(f)"}]})
})
.then(r => r.json())
.then(d => console.log("DATASETS:", d.run.stdout))
.catch(e => console.error("ERROR:", e))
'

echo "--- Checking pandas ---"
docker exec devcapsules_bridge node -e '
fetch("http://piston:2000/api/v2/execute", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({language: "python", version: "3.10.0", files: [{content: "import pandas; print(pandas.__version__)"}]})
})
.then(r => r.json())
.then(d => console.log("PANDAS:", d.run.stdout || d.run.stderr))
.catch(e => console.error("ERROR:", e))
'
