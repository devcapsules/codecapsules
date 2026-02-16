# CodeCapsule Infrastructure — Azure VMSS + Cloudflare Tunnel

## Architecture

```
Student clicks "Run Python/Java/C++"
         │
         ▼
┌───────────────────────────────────────┐
│     Cloudflare Worker (API Router)    │
│  POST /api/execute                    │
│  Routes: SQL → D1, everything else ↓  │
└──────────────────┬────────────────────┘
                   │ HTTPS
                   ▼
┌───────────────────────────────────────┐
│  Cloudflare Tunnel (Zero Trust)       │
│  tunnel.devcapsules.com               │
│  Automatic load balancing across VMs  │
└─────────┬───────────────────┬─────────┘
          │                   │
          ▼                   ▼
┌──────────────────┐ ┌──────────────────┐
│  Azure VM #1     │ │  Azure VM #2     │  ← VMSS (auto-scales 1–5)
│ (NO public IP)   │ │ (NO public IP)   │
│                  │ │                  │
│  [cloudflared]   │ │  [cloudflared]   │  ← Same tunnel token
│       │          │ │       │          │
│  [Piston :2000]  │ │  [Piston :2000]  │  ← Code execution engine
│   Python, JS,    │ │   Python, JS,    │
│   Java, C, C++   │ │   Java, C, C++   │
└──────────────────┘ └──────────────────┘
```

**Execution Tiers:**
| Tier | Languages | Where | Latency |
|------|-----------|-------|---------|
| Edge | SQL | Cloudflare D1 | ~5ms |
| Piston | Python, JavaScript, Java, C++, C | Azure VMSS | ~200–500ms |

**Budget:** Cloudflare ($0) + Azure (~$30–50/month idle, ~$250/month peak)

---

## Prerequisites

1. **Azure CLI** — [Install](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
   ```bash
   az login
   az account set --subscription "<your-subscription-id>"
   ```

2. **cloudflared CLI** — [Install](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
   ```bash
   cloudflared login   # Authenticates with your Cloudflare account
   ```

3. **Domain in Cloudflare** — `devcapsules.com` (or your domain) must be active in Cloudflare DNS.

---

## Deployment Steps

### Step 1: Create Cloudflare Tunnel

```bash
cd infra
chmod +x setup-tunnel.sh
./setup-tunnel.sh
```

This creates a tunnel named `codecapsule-piston` and outputs a **tunnel token**.

**After the script runs**, configure the public hostname in the Cloudflare dashboard:

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com) → **Networks** → **Tunnels**
2. Click `codecapsule-piston` → **Public Hostname** tab
3. Add hostname:
   - **Subdomain:** `tunnel`
   - **Domain:** `devcapsules.com`
   - **Service Type:** `HTTP`
   - **URL:** `localhost:2000`

### Step 2: Deploy Azure VMSS

```bash
chmod +x deploy-azure.sh
./deploy-azure.sh <TUNNEL_TOKEN_FROM_STEP_1>
```

This creates:
- Resource Group: `codecapsule-rg`
- VNet with private subnet (10.0.1.0/24)
- NSG denying all inbound internet traffic
- VMSS with 1× Standard_B2s (auto-scales to 5)
- Each VM bootstraps with Docker + Piston + cloudflared

**Wait ~5 minutes** for the first VM to fully initialize.

### Step 3: Verify

```bash
# Check VMSS instances
az vmss list-instances -g codecapsule-rg -n codecapsule-piston -o table

# Check Piston is reachable through the tunnel
curl -s https://tunnel.devcapsules.com/api/v2/runtimes | jq '.[] | .language'

# Expected output:
# "c"
# "c++"
# "java"
# "javascript"
# "node"
# "python"
```

### Step 4: Test End-to-End

```bash
# Python
curl -s -X POST https://devcapsules-api.devleep-edu.workers.dev/api/execute \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(40 + 2)","language":"python"}'

# JavaScript
curl -s -X POST https://devcapsules-api.devleep-edu.workers.dev/api/execute \
  -H "Content-Type: application/json" \
  -d '{"source_code":"console.log(40 + 2)","language":"javascript"}'

# Java
curl -s -X POST https://devcapsules-api.devleep-edu.workers.dev/api/execute \
  -H "Content-Type: application/json" \
  -d '{"source_code":"public class Main { public static void main(String[] args) { System.out.println(42); } }","language":"java"}'

# C
curl -s -X POST https://devcapsules-api.devleep-edu.workers.dev/api/execute \
  -H "Content-Type: application/json" \
  -d '{"source_code":"#include <stdio.h>\nint main() { printf(\"42\\n\"); return 0; }","language":"c"}'

# SQL (edge — no Azure needed)
curl -s -X POST https://devcapsules-api.devleep-edu.workers.dev/api/execute \
  -H "Content-Type: application/json" \
  -d '{"source_code":"SELECT 1+1 AS result","language":"sql"}'
```

---

## Operations

### Scale Manually

```bash
# Scale to 3 instances
az vmss scale -g codecapsule-rg -n codecapsule-piston --new-capacity 3

# Scale back to 1
az vmss scale -g codecapsule-rg -n codecapsule-piston --new-capacity 1
```

### View Auto-Scale Status

```bash
az monitor autoscale show -g codecapsule-rg -n codecapsule-piston-autoscale -o table
```

### SSH into a VM (for debugging)

VMs have no public IPs. Use Azure Bastion or a jump box:
```bash
# Or temporarily add a public IP to one instance for debugging
az vmss list-instances -g codecapsule-rg -n codecapsule-piston -o table
```

### Update Piston / Add Languages

SSH into a VM, then:
```bash
# List installed runtimes
curl -s http://localhost:2000/api/v2/runtimes | jq .

# Install a new language
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"rust","version":"1.68.2"}'
```

> **Note:** New VMSS instances use the cloud-init, so add new languages to `cloud-init.yaml` and reimage.

### Reimage All VMs (apply cloud-init changes)

```bash
az vmss reimage -g codecapsule-rg -n codecapsule-piston
```

### Tear Down Everything

```bash
az group delete -g codecapsule-rg --yes --no-wait
```

---

## Troubleshooting

| Symptom | Check | Fix |
|---------|-------|-----|
| `PISTON_URL not configured` | `wrangler.toml` → `PISTON_URL` | Set to `https://tunnel.devcapsules.com` |
| `Piston returned 502` | Tunnel not connected | Verify cloudflared running on VM |
| `Piston returned 404` | Wrong Piston API path | Should be `/api/v2/execute` |
| Language not found | Runtime not installed | Install via Piston packages API |
| Timeout | VM overloaded | Check CPU, scale up VMSS |
| `fetch failed` from Worker | Tunnel hostname DNS not configured | Check Cloudflare DNS for `tunnel` CNAME |

### Check VM Logs

```bash
# Cloud-init log (bootstrap progress)
cat /var/log/cloud-init-output.log

# Piston container logs
docker logs piston_api

# cloudflared logs
journalctl -u cloudflared -f

# Health check log
cat /var/log/codecapsule-health.log
```

---

## File Structure

```
infra/
├── README.md              ← This file
├── setup-tunnel.sh        ← Step 1: Create Cloudflare Tunnel
├── cloud-init.yaml        ← VM bootstrap config (Docker + Piston + cloudflared)
└── deploy-azure.sh        ← Step 2: Deploy Azure VMSS
```

## Piston API Reference

The Worker's `execute.ts` calls Piston's API at `POST /api/v2/execute`:

```json
{
  "language": "python",
  "version": "*",
  "files": [{"name": "main.py", "content": "print(42)"}],
  "stdin": "",
  "args": [],
  "compile_timeout": 10000,
  "run_timeout": 10000,
  "run_memory_limit": 134217728
}
```

Response:
```json
{
  "language": "python",
  "version": "3.10.0",
  "run": {
    "stdout": "42\n",
    "stderr": "",
    "code": 0,
    "signal": null,
    "output": "42\n"
  }
}
```

For compiled languages (Java, C, C++), the response also includes a `compile` object with the same structure.
