# 🌉 Azure Dark Tunnel Architecture — Implementation Guide

## Summary

This implementation creates an **Enterprise Hybrid Bridge** where:
- **Cloudflare Workers** handle authentication, rate limiting, caching, and API routing at the edge
- **Azure VMSS (Virtual Machine Scale Sets)** runs the battle-tested 3-agent AI pipeline and the Piston code execution engine
- Workers call Azure via a highly secure, private **Cloudflare Zero Trust Tunnel** using HMAC-signed requests

## Architecture Pivot

> **AWS has been completely eliminated.** The original design used Lambda for AI generation.
> The current architecture uses Cloudflare Tunnel → Azure VMSS, reducing cost to ~$52/mo
> and eliminating all AWS dependencies. AWS credits ($250) remain unused.

## Files Created/Modified

### Azure VMSS Side (apps/api/src/)

| File | Purpose |
|------|---------|
| `middleware/worker-auth.ts` | HMAC signature verification for incoming Worker requests |
| `routes/internal.ts` | Internal endpoints only accessible by Cloudflare Workers |
| `server.ts` | Express server running inside Docker on the Azure VM |
| `Dockerfile` | Builds the Express API alongside the Piston execution engine |

### Workers Side (apps/workers/src/)

| File | Purpose |
|------|---------|
| `utils/tunnel-client.ts` | `TunnelClient` — HMAC-signed HTTP client for routing traffic down the Cloudflare Tunnel |
| `queues/generation-consumer.ts` | Cloudflare Queue Consumer that triggers the Azure AI Pipeline |
| `routes/mentor.ts` | AI hint generation via the Azure bridge |
| `routes/execute.ts` | Two-tier: SQL at edge (D1, <10ms), everything else → Piston via Tunnel |
| `index.ts` | Main router with full middleware chain |

### Configuration

| File | Changes |
|------|---------|
| `wrangler.toml` | `TUNNEL_URL` + `PISTON_URL` vars, `WORKER_SHARED_SECRET` secret |
| `worker-configuration.d.ts` | `TUNNEL_URL`, `PISTON_URL`, `WORKER_SHARED_SECRET` types |

## Request Flow

```
User Request
    │
    ▼
┌─────────────────────────────┐
│    Cloudflare Workers       │
│  ┌────────────────────────┐ │
│  │ Rate Limit → Body Limit│ │
│  │ → Auth → Route Handler │ │
│  └──────────┬─────────────┘ │
│             │               │
│  ┌──────────▼─────────────┐ │
│  │ SQL? → D1 (edge, <10ms)│ │
│  │ Code? → Piston (tunnel)│ │
│  │ AI? → Queue → Consumer │ │
│  └──────────┬─────────────┘ │
└─────────────┼───────────────┘
              │
              │ Cloudflare Zero Trust Tunnel
              │ + HMAC Signature
              │ (HTTP/2, private network)
              ▼
┌─────────────────────────────┐
│   Azure VMSS (Auto-Scale)   │
│   No public IP — NSG locked │
│  ┌────────────────────────┐ │
│  │ cloudflared connector  │ │
│  │ (4× Mumbai PoP conns)  │ │
│  └──────────┬─────────────┘ │
│             │               │
│  ┌──────────▼─────────────┐ │
│  │ /internal/generate     │ │
│  │ /internal/mentor-hint  │ │
│  │ /internal/execute      │ │
│  └──────────┬─────────────┘ │
│             │               │
│  ┌──────────▼─────────────┐ │
│  │ Piston (port 2000)     │ │
│  │ Python, JS, Java, C/C++│ │
│  └─────────────────────────┘ │
│  ┌──────────▼─────────────┐ │
│  │ GenerationPipeline     │ │
│  │ (Pedagogist → Coder →  │ │
│  │  Debugger)             │ │
│  └──────────┬─────────────┘ │
└─────────────┼───────────────┘
              │
              ▼
         Azure OpenAI
```

## Infrastructure Details

| Component | Value |
|-----------|-------|
| Tunnel Name | `codecapsule-piston` |
| Tunnel ID | `78e0afda-5c93-4ad7-b59d-ec44b5af8a1b` |
| DNS Route | `tunnel.devcapsules.com` (CNAME) |
| Protocol | HTTP/2 (QUIC blocked by Azure VNet) |
| PoP Connections | 4× Mumbai (bom03/06/08/09/10) |
| VMSS Name | `codecapsule-piston` |
| Resource Group | `codecapsule-rg` (Central India) |
| VM Size | Standard_B2as_v2 |
| Auto-scale | 1–5 instances |

## Security Model (Double-Layered)

1. **Network Layer (The "Dark VM"):**
   - The Azure VM has **no public IP address** and all inbound ports (80/443) are blocked
   - Traffic can only reach the VM through the Cloudflare `cloudflared` daemon
   - NSG (Network Security Group) denies all inbound; only cloudflared's outbound tunnel connection is allowed

2. **Application Layer (Internal Endpoints):**
   - `/internal/*` — Express middleware (`worker-auth.ts`) rejects any request lacking a valid HMAC signature
   - **HMAC Format:** `HMAC-SHA256(timestamp:caller:payload, sharedSecret)`
   - 30-second timestamp window prevents replay attacks
   - Caller identity included for audit logging

3. **Edge Layer (Workers Middleware Chain):**
   - Native Cloudflare rate limiting (atomic, per-PoP, per-plan tier)
   - Hono stream-safe body limits (100KB execute, 512KB generate, 1MB default)
   - JWT/API key auth with write-throttled `lastUsed` tracking
   - Exact-match route security (no prefix injection)

## Configuration Required

### 1. Generate Application Shared Secret
```powershell
# Generate a secure random secret for HMAC signing
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### 2. Set Azure VM Environment Variable
```bash
# In your Azure VM docker-compose.yml or environment file
WORKER_SHARED_SECRET=your-generated-secret
```

### 3. Set Workers Secret
```bash
wrangler secret put WORKER_SHARED_SECRET
# Paste the same secret
```

### 4. Tunnel URL in wrangler.toml (already configured)
```toml
TUNNEL_URL = "https://tunnel.devcapsules.com"
PISTON_URL = "https://tunnel.devcapsules.com"
```

## Testing the Bridge

### 1. Test Worker Health
```bash
curl https://devcapsules-api.devleep-edu.workers.dev/health
```

### 2. Test Code Execution (SQL — edge, no tunnel)
```bash
curl -X POST https://devcapsules-api.devleep-edu.workers.dev/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{"source_code": "SELECT 1+1 as result", "language": "sql"}'
```

### 3. Test Code Execution (Python — Piston via tunnel)
```bash
curl -X POST https://devcapsules-api.devleep-edu.workers.dev/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{"source_code": "print(\"hello\")", "language": "python"}'
```

### 4. Test Generation (authenticated, async)
```bash
curl -X POST https://devcapsules-api.devleep-edu.workers.dev/api/v1/generate \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "FizzBuzz", "language": "python"}'
```

### 5. Poll Job Progress
```bash
curl https://devcapsules-api.devleep-edu.workers.dev/api/v1/generate/JOB_ID/status \
  -H "Authorization: Bearer YOUR_JWT"
```

## Timeouts

| Component | Timeout | Note |
|-----------|---------|------|
| Cloudflare Queue Consumer | 15 minutes | Perfect for heavy AI tasks |
| Cloudflare Tunnel | 100 seconds | Standard HTTP connection limit |
| Tunnel Client (per request) | 55 seconds | Configured in `TunnelClient` constructor |
| Generation Pipeline | ~60 seconds | Runs smoothly within Queue limits |
| Mentor Hint (Tunnel) | 15 seconds | Lightweight single-prompt call |
| Piston Execution | 10–30 seconds | Hard-capped by runtime settings |

## Cost Tracking

The queue consumer logs all generation costs directly to Cloudflare D1:
- `generation_logs` table tracks token usage
- Daily spend tracked in KV (`system:ai:daily_spend`)
- Circuit breaker trips at `$15/day` (configurable) to protect your $1,000 Azure credits

## Estimated Monthly Cost

| Component | Cost |
|-----------|------|
| Cloudflare Workers (free tier) | $0 |
| Cloudflare KV (free tier) | $0 |
| Cloudflare D1 (free tier) | $0 |
| Cloudflare Tunnel | Free |
| Azure VMSS (1× B2as_v2) | ~$36 |
| Azure OpenAI (usage-based) | ~$16 |
| **Total at ~100 users** | **~$52/mo** |
| AWS spend | **$0** |
