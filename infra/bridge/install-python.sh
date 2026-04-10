#!/bin/bash
# Check datasets dir from container vs sandbox perspective
echo "--- From container ---"
docker exec devcapsules_piston ls -la /piston/packages/python/3.10.0/datasets/ 2>&1

echo "--- From sandbox (Python) ---"
docker exec devcapsules_bridge node -e '
fetch("http://piston:2000/api/v2/execute", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({language: "python", version: "3.10.0", files: [{content: "import os\nbase=\"/piston/packages/python/3.10.0\"\nfor item in os.listdir(base):\n  print(item)\nprint(\"---datasets---\")\ndp=os.path.join(base,\"datasets\")\nprint(os.path.exists(dp))\nif os.path.exists(dp):\n  for f in os.listdir(dp): print(f)"}]})
})
.then(r => r.json())
.then(d => console.log(d.run.stdout || d.run.stderr))
.catch(e => console.error("ERROR:", e))
'
