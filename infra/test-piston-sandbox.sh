#!/bin/bash
# Write test Python script
cat > /tmp/test_payload.py << 'PYEOF'
import os, glob
print('exists:', os.path.exists('/piston/datasets'))
try:
    print('ls:', os.listdir('/piston/datasets'))
except Exception as e:
    print('err:', e)
print('cwd:', os.getcwd())
print('glob:', glob.glob('/piston/datasets/*.csv'))
PYEOF

# Build JSON payload
CONTENT=$(python3 -c "import sys,json; print(json.dumps(open('/tmp/test_payload.py').read()))")
echo "{\"language\":\"python\",\"version\":\"3.10.0\",\"files\":[{\"name\":\"test.py\",\"content\":${CONTENT}}]}" > /tmp/req.json

# Execute via Piston
curl -s -X POST http://172.18.0.2:2000/api/v2/execute -H 'Content-Type: application/json' -d @/tmp/req.json
