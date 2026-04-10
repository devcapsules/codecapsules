#!/bin/bash
# Copy datasets into Piston's Python runtime directory
echo "--- Copying CSVs into Piston ---"
docker exec devcapsules_piston mkdir -p /piston/packages/python/3.10.0/datasets
docker cp /opt/devcapsules-repo/apps/dashboard/public/apple_global_sales_dataset.csv devcapsules_piston:/piston/packages/python/3.10.0/datasets/
docker cp /opt/devcapsules-repo/apps/dashboard/public/spotify-tracks-dataset.csv devcapsules_piston:/piston/packages/python/3.10.0/datasets/
docker exec devcapsules_piston chmod -R 444 /piston/packages/python/3.10.0/datasets/*
docker exec devcapsules_piston chmod 555 /piston/packages/python/3.10.0/datasets

echo "--- Verify from container ---"
docker exec devcapsules_piston ls -la /piston/packages/python/3.10.0/datasets/

echo "--- Verify from sandbox ---"
docker exec devcapsules_bridge node -e '
fetch("http://piston:2000/api/v2/execute", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({language: "python", version: "3.10.0", files: [{content: "import os, pandas as pd\nfiles=os.listdir(\"/piston/packages/python/3.10.0/datasets/\")\nprint(\"Files:\", files)\ndf=pd.read_csv(\"/piston/packages/python/3.10.0/datasets/apple_global_sales_dataset.csv\")\nprint(\"Apple rows:\", len(df))\ndf2=pd.read_csv(\"/piston/packages/python/3.10.0/datasets/spotify-tracks-dataset.csv\")\nprint(\"Spotify rows:\", len(df2))"}]})
})
.then(r => r.json())
.then(d => console.log(d.run.stdout || d.run.stderr))
.catch(e => console.error("ERROR:", e))
'

echo "=== ALL INSTALLED RUNTIMES ==="
docker exec devcapsules_bridge node -e '
fetch("http://piston:2000/api/v2/runtimes")
.then(r => r.json())
.then(d => {
  d.forEach(r => console.log(r.language, r.version, "aliases:", r.aliases.join(",")));
  console.log("Total runtimes:", d.length);
})
.catch(e => console.error("ERROR:", e))
'
