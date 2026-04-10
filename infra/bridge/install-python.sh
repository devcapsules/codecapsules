#!/bin/bash
# Install Python 3.10.0 on Piston via its API, then verify
docker exec devcapsules_bridge node -e '
fetch("http://piston:2000/api/v2/packages", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({language: "python", version: "3.10.0"})
})
.then(r => r.text())
.then(t => console.log("INSTALL:", t))
.catch(e => console.error("INSTALL_ERROR:", e))
'

echo "--- Checking runtimes ---"
docker exec devcapsules_bridge node -e '
fetch("http://piston:2000/api/v2/runtimes")
.then(r => r.json())
.then(d => console.log("RUNTIMES:", JSON.stringify(d)))
.catch(e => console.error("CHECK_ERROR:", e))
'

echo "--- Testing Python execution ---"
docker exec devcapsules_bridge node -e '
fetch("http://piston:2000/api/v2/execute", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({language: "python", version: "3.10.0", files: [{content: "print(42)"}]})
})
.then(r => r.json())
.then(d => console.log("EXEC:", JSON.stringify(d)))
.catch(e => console.error("EXEC_ERROR:", e))
'
