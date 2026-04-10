#!/bin/bash
# Install Python 3.10.0 on Piston via its API
docker exec devcapsules_bridge node -e '
fetch("http://piston:2000/api/v2/packages", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({language: "python", version: "3.10.0"})
})
.then(r => r.text())
.then(t => console.log("RESULT:", t))
.catch(e => console.error("ERROR:", e))
'
