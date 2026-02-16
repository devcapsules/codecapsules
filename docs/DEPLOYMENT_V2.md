# Devcapsules v2 Deployment Guide

Complete deployment guide for the Cloudflare Workers + Azure VMSS architecture.

> **Last Updated:** February 16, 2026  
> **Status:** Infrastructure deployed and verified

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Cloudflare Account Setup](#cloudflare-account-setup)
3. [Environment Setup](#environment-setup)
4. [Workers Deployment](#workers-deployment)
5. [Database Migration](#database-migration)
6. [Azure VMSS + Piston Deployment](#azure-vmss--piston-deployment)
7. [Cloudflare Tunnel Setup](#cloudflare-tunnel-setup)
8. [DNS Configuration](#dns-configuration)
9. [Secrets Configuration](#secrets-configuration)
10. [Testing](#testing)
11. [Monitoring](#monitoring)
12. [Rollback](#rollback)

---

## Prerequisites

### Required Tools
```bash
# Node.js 20+
node --version  # Should be >= 20.0.0

# pnpm (recommended) or npm
npm install -g pnpm

# Wrangler CLI (Cloudflare)
npm install -g wrangler

# Azure CLI
az --version

# cloudflared (Cloudflare Tunnel client)
# Windows: winget install Cloudflare.cloudflared
# Mac: brew install cloudflared
# Linux: see https://pkg.cloudflare.com/
```

### Required Accounts
- **Cloudflare Account** (Free or Pro) with Workers, D1, KV, Queues enabled
- **Azure Account** with OpenAI access + VM quota
- **Domain** (e.g., `devcapsules.com`) added to Cloudflare

---

## Cloudflare Account Setup

### 1. Create Cloudflare Account
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Create account or log in
3. Add your domain (e.g., `devcapsules.com`)

### 2. Enable Required Services
In the Cloudflare dashboard, enable:
- **Workers** (free tier includes 100K requests/day)
- **D1** (free tier includes 5M rows read/day)
- **KV** (free tier includes 100K reads/day)
- **Queues** (free tier includes 1M operations/month)
- **R2** (optional, for asset storage)

### 3. Get API Token
1. Go to **My Profile** → **API Tokens**
2. Create token with permissions:
   - Account: Workers Scripts (Edit)
   - Zone: DNS (Edit)
3. Copy the token

### 4. Login via CLI
```bash
wrangler login
# Or use token directly:
# export CLOUDFLARE_API_TOKEN=your_token_here
```

---

## Environment Setup

### 1. Clone and Install
```bash
cd apps/workers
pnpm install
```

### 2. Create Resources
```bash
# Create D1 Database
wrangler d1 create devcapsules-db
# Copy the database_id to wrangler.toml

# Create KV Namespaces
wrangler kv namespace create "CACHE"
wrangler kv namespace create "SESSIONS"
wrangler kv namespace create "JOB_PROGRESS"
wrangler kv namespace create "RATE_LIMITS"
# Copy the IDs to wrangler.toml

# Create Queue
wrangler queues create generation-queue
wrangler queues create generation-queue-dlq

# Create R2 Bucket (optional)
wrangler r2 bucket create devcapsules-assets
```

### 3. Update wrangler.toml
Replace placeholder IDs in `apps/workers/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "devcapsules-db"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Replace

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_CACHE_KV_ID_HERE"  # ← Replace

[[kv_namespaces]]
binding = "SESSIONS"
id = "YOUR_SESSIONS_KV_ID_HERE"  # ← Replace

# ... etc
```

---

## Workers Deployment

### 1. Run Database Migrations
```bash
cd apps/workers

# Apply migrations to local D1 (for testing)
wrangler d1 execute devcapsules-db --local --file=./migrations/0001_initial_schema.sql

# Apply migrations to remote D1 (production)
wrangler d1 execute devcapsules-db --remote --file=./migrations/0001_initial_schema.sql
```

### 2. Deploy Main API Worker
```bash
cd apps/workers

# Deploy to staging
pnpm run deploy:staging

# Deploy to production
pnpm run deploy:production
```

### 3. Deploy Python Sandbox Worker
```bash
cd apps/workers-python-sandbox

pnpm install
pnpm run deploy
```

### 4. Deploy JavaScript Sandbox Worker
```bash
cd apps/workers-js-sandbox

pnpm install
pnpm run deploy
```

### 5. Verify Deployments
```bash
# Check main API
curl https://api.devcapsules.com/health

# Check Python sandbox (internal only)
# Check JS sandbox (internal only)
```

---

## Database Migration

### From Neon PostgreSQL to Cloudflare D1

If you have existing data in Neon:

```bash
# 1. Export from Neon
pg_dump -h your-neon-host.neon.tech -U username -d database --data-only -f export.sql

# 2. Transform to SQLite format (manual step)
# PostgreSQL and SQLite have syntax differences

# 3. Import to D1
wrangler d1 execute devcapsules-db --remote --file=./import.sql
```

### Fresh Start
If starting fresh, just run migrations:
```bash
wrangler d1 execute devcapsules-db --remote --file=./migrations/0001_initial_schema.sql
```

---

## Azure VMSS + Piston Deployment

> **Note:** AWS Lambda executor has been **eliminated**. All non-SQL code runs on
> Azure VMSS behind Cloudflare Tunnel.

### 1. Login to Azure
```bash
# Login to your Azure account
az login --tenant YOUR_TENANT_ID

# Set subscription
az account set --subscription YOUR_SUBSCRIPTION_ID
```

### 2. Create Resource Group
```bash
az group create --name codecapsule-rg --location centralindia
```

### 3. Create Network (no public IPs)
```bash
# VNet + Subnet
az network vnet create \
  --resource-group codecapsule-rg \
  --name codecapsule-vnet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name piston-subnet \
  --subnet-prefix 10.0.1.0/24

# NSG (deny all inbound from internet)
az network nsg create --resource-group codecapsule-rg --name piston-nsg
az network nsg rule create \
  --resource-group codecapsule-rg --nsg-name piston-nsg \
  --name DenyAllInternetInbound --priority 4096 \
  --direction Inbound --access Deny --protocol "*" \
  --source-address-prefixes Internet \
  --destination-address-prefixes "*" --destination-port-ranges "*"

az network vnet subnet update \
  --resource-group codecapsule-rg --vnet-name codecapsule-vnet \
  --name piston-subnet --network-security-group piston-nsg
```

### 4. Render Cloud-Init
Before creating VMSS, render the cloud-init template with tunnel credentials:

```bash
# Get values from .cloudflared/ directory after tunnel creation
TUNNEL_ID="your-tunnel-id"
ACCOUNT_TAG="your-account-tag"
TUNNEL_SECRET="your-tunnel-secret"
TUNNEL_HOSTNAME="tunnel.devcapsules.com"

sed -e "s|__TUNNEL_ID__|${TUNNEL_ID}|g" \
    -e "s|__ACCOUNT_TAG__|${ACCOUNT_TAG}|g" \
    -e "s|__TUNNEL_SECRET__|${TUNNEL_SECRET}|g" \
    -e "s|__TUNNEL_HOSTNAME__|${TUNNEL_HOSTNAME}|g" \
    infra/cloud-init-ascii.yaml > /tmp/cloud-init-rendered.yaml
```

### 5. Create VMSS
```bash
az vmss create \
  --resource-group codecapsule-rg \
  --name codecapsule-piston \
  --image Ubuntu2204 \
  --vm-sku Standard_B2as_v2 \
  --instance-count 1 \
  --vnet-name codecapsule-vnet \
  --subnet piston-subnet \
  --custom-data /tmp/cloud-init-rendered.yaml \
  --admin-username codecapsule \
  --generate-ssh-keys \
  --orchestration-mode Flexible
```

### 6. Configure Auto-Scale
```bash
VMSS_ID=$(az vmss show -g codecapsule-rg -n codecapsule-piston --query id -o tsv)

az monitor autoscale create \
  -g codecapsule-rg --resource "$VMSS_ID" \
  --min-count 1 --max-count 5 --count 1 --name codecapsule-piston-autoscale

# Scale UP: CPU > 70% for 3 min
az monitor autoscale rule create \
  -g codecapsule-rg --autoscale-name codecapsule-piston-autoscale \
  --condition "Percentage CPU > 70 avg 3m" --scale out 1 --cooldown 5

# Scale DOWN: CPU < 30% for 5 min
az monitor autoscale rule create \
  -g codecapsule-rg --autoscale-name codecapsule-piston-autoscale \
  --condition "Percentage CPU < 30 avg 5m" --scale in 1 --cooldown 5
```

### 7. Wait for Bootstrap (~5 min)
```bash
# Find instance name
az vmss list-instances -g codecapsule-rg -n codecapsule-piston --query "[0].name" -o tsv

# Check cloud-init progress
az vm run-command invoke -g codecapsule-rg --name INSTANCE_NAME \
  --command-id RunShellScript --scripts "tail -20 /var/log/cloud-init-output.log"
```

### 8. Verify Piston Runtimes
```bash
az vm run-command invoke -g codecapsule-rg --name INSTANCE_NAME \
  --command-id RunShellScript --scripts "curl -s http://localhost:2000/api/v2/runtimes"
```

Expected: python 3.10.0, javascript 18.15.0, java 15.0.2, c 10.2.0, c++ 10.2.0

---

## Cloudflare Tunnel Setup

### 1. Login to Cloudflare
```bash
cloudflared login
# Browser opens — select your domain (devcapsules.com)
```

### 2. Create Tunnel
```bash
cloudflared tunnel create codecapsule-piston
# Outputs: Tunnel ID and credentials file path
```

### 3. Create DNS Route
```bash
cloudflared tunnel route dns codecapsule-piston tunnel.devcapsules.com
```

### 4. Important Notes
- The **cloud-init** on VMs automatically starts cloudflared with config-file mode
- Protocol is **HTTP/2** (not QUIC) because Azure VNets block UDP 7844
- Credentials are embedded in the cloud-init via `__TUNNEL_ID__`, `__ACCOUNT_TAG__`, `__TUNNEL_SECRET__` placeholders
- Each VM instance creates 4 connections to nearest Cloudflare PoPs

---

## DNS Configuration

### 1. DNS Records in Cloudflare
```
Type    Name              Content                                        Proxy
CNAME   api               devcapsules-api.devleep-edu.workers.dev         Yes
CNAME   tunnel            <tunnel-id>.cfargotunnel.com                    Yes
CNAME   app               <pages-project>.pages.dev (when deployed)       Yes
```

### 2. Workers Custom Domain
In Cloudflare Dashboard:
1. Go to **Workers & Pages** -> Your Worker
2. Click **Settings** -> **Triggers**
3. Add Custom Domain: `api.devcapsules.com`

### 3. Tunnel DNS (already created)
```bash
# This was done during tunnel setup:
cloudflared tunnel route dns codecapsule-piston tunnel.devcapsules.com
```

---

## Secrets Configuration

### Workers Secrets
```bash
cd apps/workers

# Azure OpenAI credentials
wrangler secret put AZURE_OPENAI_API_KEY

# JWT signing secret (generate a secure random string)
wrangler secret put JWT_SECRET

# Shared secret for tunnel HMAC auth
wrangler secret put WORKER_SHARED_SECRET
```

### Verify Secrets
```bash
wrangler secret list
```

### Environment Variables (in wrangler.toml)
These are NOT secrets — they're in `wrangler.toml`:
```toml
TUNNEL_URL = "https://tunnel.devcapsules.com"
PISTON_URL = "https://tunnel.devcapsules.com"
AZURE_OPENAI_ENDPOINT = "https://your-resource.openai.azure.com"
AZURE_OPENAI_DEPLOYMENT = "gpt-4o"
```

---

## Testing

### 1. Health Check
```bash
curl https://api.devcapsules.com/health
```

Expected response:
```json
{
  "success": true,
  "version": "2.0.0",
  "timestamp": "2024-...",
  "services": {
    "d1": true,
    "kv": true,
    "ai": true,
    "queues": true
  },
  "edge": {
    "region": "IAD",
    "colo": "DCA"
  }
}
```

### 2. Test Authentication
```bash
# Register
curl -X POST https://api.devcapsules.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePassword123"}'

# Login
curl -X POST https://api.devcapsules.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePassword123"}'
```

### 3. Test Tunnel Connectivity
```bash
# List runtimes through tunnel
curl -s https://tunnel.devcapsules.com/api/v2/runtimes | jq .
```

### 4. Test Code Execution
```bash
# Python (via Piston through tunnel)
curl -X POST https://tunnel.devcapsules.com/api/v2/execute \
  -H "Content-Type: application/json" \
  -d '{"language":"python","version":"3.10.0","files":[{"name":"main.py","content":"print(42)"}]}'

# SQL (edge, via D1)
curl -X POST https://devcapsules-api.devleep-edu.workers.dev/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{"source_code":"SELECT 42 as answer","language":"sql"}'

# Java (via Piston)
curl -X POST https://tunnel.devcapsules.com/api/v2/execute \
  -H "Content-Type: application/json" \
  -d '{"language":"java","version":"15.0.2","files":[{"name":"Main.java","content":"public class Main { public static void main(String[] a) { System.out.println(42); } }"}]}'

# C (via Piston)
curl -X POST https://tunnel.devcapsules.com/api/v2/execute \
  -H "Content-Type: application/json" \
  -d '{"language":"c","version":"10.2.0","files":[{"name":"main.c","content":"#include <stdio.h>\nint main(){printf(\"42\\n\");return 0;}"}]}'

# C++ (via Piston)
curl -X POST https://tunnel.devcapsules.com/api/v2/execute \
  -H "Content-Type: application/json" \
  -d '{"language":"c++","version":"10.2.0","files":[{"name":"main.cpp","content":"#include <iostream>\nint main(){std::cout<<42<<std::endl;return 0;}"}]}'
```

### 5. Test Generation (requires auth)
```bash
# Start generation
curl -X POST https://api.devcapsules.com/api/v1/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prompt":"FizzBuzz","language":"python","difficulty":"easy"}'

# Poll status
curl https://api.devcapsules.com/api/v1/generate/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Test VM Health
```bash
# Find instance name
az vmss list-instances -g codecapsule-rg -n codecapsule-piston --query "[0].name" -o tsv

# Run health check on VM
az vm run-command invoke -g codecapsule-rg --name INSTANCE_NAME \
  --command-id RunShellScript --scripts "/opt/codecapsule/healthcheck.sh"
```

---

## Monitoring

### Cloudflare Workers Analytics
1. Go to **Workers & Pages** -> Your Worker -> **Analytics**
2. View: request count, CPU time, error rate, geographic distribution

### Real-time Worker Logs
```bash
wrangler tail
```

### Azure VMSS Monitoring
```bash
# List instances
az vmss list-instances -g codecapsule-rg -n codecapsule-piston -o table

# Check cloud-init logs on instance
az vm run-command invoke -g codecapsule-rg --name INSTANCE_NAME \
  --command-id RunShellScript --scripts "tail -30 /var/log/cloud-init-output.log"

# Check cloudflared status
az vm run-command invoke -g codecapsule-rg --name INSTANCE_NAME \
  --command-id RunShellScript --scripts "systemctl status cloudflared --no-pager"

# Check Piston health
az vm run-command invoke -g codecapsule-rg --name INSTANCE_NAME \
  --command-id RunShellScript --scripts "/opt/codecapsule/healthcheck.sh"

# Health check cron logs
az vm run-command invoke -g codecapsule-rg --name INSTANCE_NAME \
  --command-id RunShellScript --scripts "tail -20 /var/log/codecapsule-health.log"
```

### Tunnel Status
```bash
# Check tunnel connections from local machine
cloudflared tunnel info codecapsule-piston
```

### D1 Metrics
1. Go to **D1** -> Your Database -> **Metrics**
2. View: read/write operations, database size, query latency

### Set Up Alerts
1. Go to **Notifications** in Cloudflare Dashboard
2. Create alerts for:
   - Worker error rate > 1%
   - Response time > 5s
   - Queue depth > 100

---

## Rollback

### Rollback Worker
```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback --version VERSION_ID
```

### Emergency: Disable Worker
In Cloudflare Dashboard:
1. Go to **Workers & Pages** → Your Worker
2. Click **Disable**

### Point DNS Back to Old API
```bash
# Update CNAME record to point to old Lambda Function URL
# Or restore from DNS backup
```

---

## Cost Optimization Tips

### Free Tier Limits (Stay Under)
- Workers: 100K requests/day
- D1: 5M rows read/day, 100K writes/day
- KV: 100K reads/day, 1K writes/day
- Queues: 1M operations/month

### Monitor Usage
```bash
# View current usage
wrangler whoami
```

### Caching Strategy
- Cache published capsules in KV (1hr TTL)
- Use stale-while-revalidate pattern
- Batch database writes where possible

---

## Troubleshooting

### "Worker not found"
```bash
# Verify deployment
wrangler whoami
wrangler deployments list
```

### "D1 error: no such table"
```bash
# Re-run migrations
wrangler d1 execute devcapsules-db --remote --file=./migrations/0001_initial_schema.sql
```

### "Rate limited"
- Check KV namespace bindings
- Verify rate limit configuration
- Check user's plan tier

### "AI generation timeout"
- Queue consumer has 15-minute timeout
- Check Azure OpenAI endpoint health
- Verify queue bindings

---

## Next Steps After Deployment

1. **Monitor for 24 hours** - Watch error rates and VMSS health
2. **Deploy Dashboard** - Deploy `apps/dashboard` to Cloudflare Pages or Vercel
3. **Unify Auth** - Connect Supabase auth (dashboard) with Workers JWT
4. **Set up Git** - Initialize repo, push code, set up CI/CD
5. **Test End-to-End** - Full flow from dashboard to execution
6. **Clean up legacy code** - Remove `apps/lambda-executor/`, unused sandbox workers
7. **Add WAF rules** - Custom Cloudflare rules for API protection

---

## Support

- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **D1 Docs**: https://developers.cloudflare.com/d1/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/
