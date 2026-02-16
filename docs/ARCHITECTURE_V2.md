# DevCapsules — Architecture V2.0

> **Status:** Partially Deployed (Infrastructure Live)  
> **Created:** February 2026  
> **Last Updated:** February 16, 2026  

---

## Executive Summary

Migration from AWS-centric architecture to **Cloudflare-first + Azure VMSS** design.
AWS has been **completely eliminated**. Code execution runs on auto-scaling Azure VMs
behind a Cloudflare Tunnel, with SQL executing directly at the edge via D1.

| Metric | v1.0 (Old) | v2.0 (Current) | Status |
|--------|-----------|----------------|--------|
| Monthly Cost (100 users) | ~$120 | ~$52 | Deployed |
| Code Execution Latency (SQL) | 1-3s | <50ms (edge D1) | Deployed |
| Code Execution Latency (other) | 1-3s | 200-600ms (tunnel) | Deployed |
| Generation Timeout Risk | High (30s) | None (async queue) | Deployed |
| Single Points of Failure | 2 (EC2, Azure) | 0 (auto-scale 1-5) | Deployed |
| Auto-scaling | None | VMSS 1-5 + Workers infinite | Deployed |

---

## Budget Allocation (Actual)

| Provider | Credits | Strategic Role | Monthly Burn |
|----------|---------|---------------|-------------|
| **Cloudflare** | $10,000 | API, edge SQL, CDN, tunnel, DNS, security | ~$16 |
| **Azure** | $1,000 | OpenAI GPT-4o + VMSS Piston (~$36/mo) | ~$171 |
| **AWS** | $250 | **Not used — eliminated** | $0 |

---

## Architecture Overview (Actual)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE ECOSYSTEM ($10,000)                       │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Cloudflare   │  │  Cloudflare  │  │  Cloudflare  │  │  Cloudflare  │   │
│  │    Pages      │  │   Workers    │  │     R2       │  │     KV       │   │
│  │  (deployed)   │  │  (deployed)  │  │  (bound,     │  │  (deployed)  │   │
│  │  Dashboard    │  │  API + Edge  │  │   unused)    │  │  Cache/      │   │
│  │  static export│  │  SQL exec    │  │  Asset store │  │  Sessions/   │   │
│  │  (Next.js 14) │  │  (Hono)      │  │              │  │  Progress    │   │
│  └───────────────┘  └──────┬───────┘  └──────────────┘  └──────────────┘   │
│                            │                                                │
│                    ┌───────┴────────┐  ┌──────────────┐  ┌──────────────┐  │
│                    │   Cloudflare   │  │  Cloudflare  │  │  Cloudflare  │  │
│                    │    Tunnel      │  │   Queues     │  │     D1       │  │
│                    │  (deployed)    │  │  (deployed)  │  │  (deployed)  │  │
│                    │  codecapsule-  │  │  generation- │  │  devcapsules │  │
│                    │  piston        │  │  queue + DLQ │  │  -db         │  │
│                    └───────┬────────┘  └──────────────┘  └──────────────┘  │
│                            │                                                │
│  ┌──────────────┐  ┌──────┴───────┐                                        │
│  │  Cloudflare   │  │  Cloudflare  │                                        │
│  │   WAF/DDoS    │  │  Analytics   │                                        │
│  │   (default)   │  │  (not used)  │                                        │
│  └──────────────┘  └──────────────┘                                        │
└─────────────────────────────────────────────────────────────────────────┬───┘
                                                                         │
                              Cloudflare Tunnel (HTTP/2, Mumbai PoPs)     │
                                                                         │
┌────────────────────────────────────────────────────────────────────────┴───┐
│                    AZURE (~$171/month)                                      │
│                                                                            │
│  ┌────────────────────────┐  ┌──────────────────────────────────────────┐  │
│  │  Azure OpenAI          │  │  Azure VMSS (Central India)              │  │
│  │  GPT-4o + GPT-4o-mini  │  │  codecapsule-piston                      │  │
│  │                        │  │  Standard_B2as_v2 (2 vCPU, 8GB)          │  │
│  │  AI Generation         │  │  Auto-scale: 1-5 instances               │  │
│  │  (via Queue Consumer)  │  │                                          │  │
│  │                        │  │  ┌───────────────────────────────────┐   │  │
│  │                        │  │  │  Docker + Piston (port 2000)      │   │  │
│  │                        │  │  │  Python 3.10 | JS 18.15 | Java   │   │  │
│  │                        │  │  │  15.0.2 | C 10.2 | C++ 10.2      │   │  │
│  │                        │  │  └───────────────────────────────────┘   │  │
│  └────────────────────────┘  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘

  AWS: ██ ELIMINATED ██  (Lambda executor exists in code but not deployed)
```

---

## Component Design

### 1. API Layer — Cloudflare Workers

**Replaces:** AWS Lambda + API Gateway

```
┌─────────────────────────────────────────────────────────┐
│                   Cloudflare Workers                     │
│                                                          │
│  worker-api-router (Main Entry)                          │
│  ├── /health              → Health check                 │
│  ├── /api/v1/capsules/*   → CRUD (D1 database)          │
│  ├── /api/v1/generate     → Async generation (Queue)     │
│  ├── /api/v1/execute      → Code execution (Router)      │
│  ├── /api/v1/analytics/*  → Analytics (D1 + KV)         │
│  └── /api/v1/auth/*       → Auth (Workers + KV sessions) │
│                                                          │
│  Middleware Chain:                                        │
│  [WAF] → [Rate Limit] → [Auth] → [Route] → [Cache]      │
└─────────────────────────────────────────────────────────┘
```

### 2. Code Execution — Two-Tier (Actual)

```
                        User clicks "Run"
                              |
                              v
                    +-------------------+
                    |  Execution Router |
                    |  (CF Worker)      |
                    +---------+---------+
                              |
              +---------------+---------------+
              v                               v
    +------------------+           +------------------+
    |   TIER 1: Edge   |           |  TIER 2: Piston  |
    |   (D1 on Worker) |           |  (Azure VMSS)    |
    |                  |           |                  |
    |   SQL only       |           |   Python 3.10    |
    |                  |           |   JavaScript 18  |
    |   Latency: <10ms |           |   Java 15        |
    |   Cost: $0       |           |   C / C++ 10.2   |
    |   Scale: infinite|           |                  |
    |                  |           |   Latency: ~200ms|
    |                  |           |   Cost: $36/mo   |
    |                  |           |   Scale: 1-5 VMs |
    +------------------+           +------------------+
                                          |
                                   Cloudflare Tunnel
                                   (HTTP/2, Mumbai)
```

**Changed from plan:** Python and JavaScript moved from edge WASM to Piston.
Pyodide/WASM approach was dropped. SQL is the only edge-executed language.
AWS Lambda eliminated entirely — Azure VMSS replaces it at lower cost.

### 3. AI Generation — Async with Progress

```
 User                  CF Worker           CF Queue          Queue Consumer
  │                       │                   │                    │
  │  POST /generate       │                   │                    │
  │──────────────────────▶│                   │                    │
  │                       │  Enqueue job      │                    │
  │                       │──────────────────▶│                    │
  │  { jobId, statusUrl } │                   │                    │
  │◀──────────────────────│  (immediate)      │                    │
  │                       │                   │  Dequeue           │
  │                       │                   │───────────────────▶│
  │  GET /status          │                   │                    │
  │──────────────────────▶│  KV.get(progress) │                    │
  │  { progress: 30% }   │                   │                    │
  │◀──────────────────────│                   │                    │
  │                       │                   │                    │
  │  GET /status          │                   │                    │
  │──────────────────────▶│  KV.get(result)   │                    │
  │  { status: done }     │                   │                    │
  │◀──────────────────────│                   │                    │
```

**No timeout risk** — Queue consumers can run up to 15 minutes.

### 4. AI Cost Optimization

| Agent | Before (all GPT-4o) | After | Savings |
|-------|---------------------|-------|---------|
| Pedagogist | ~$0.006 | ~$0.0006 (4o-mini) | **90%** |
| Coder | ~$0.024 | ~$0.024 (4o) | 0% |
| Debugger | ~$0.027 | ~$0.0027 (4o-mini) | **90%** |
| **Total/capsule** | **$0.057** | **$0.027** | **53%** |

---

## Database Schema (Cloudflare D1)

```sql
-- Core Tables
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  plan          TEXT DEFAULT 'free',
  generation_quota INTEGER DEFAULT 5,
  execution_quota  INTEGER DEFAULT 100,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE capsules (
  id            TEXT PRIMARY KEY,
  creator_id    TEXT NOT NULL REFERENCES users(id),
  title         TEXT NOT NULL,
  description   TEXT,
  type          TEXT DEFAULT 'CODE',
  difficulty    TEXT DEFAULT 'MEDIUM',
  language      TEXT NOT NULL,
  function_name TEXT,
  test_count    INTEGER DEFAULT 0,
  content       TEXT NOT NULL,  -- JSON blob
  quality_score REAL,
  is_published  BOOLEAN DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- Event-Sourced Analytics
CREATE TABLE capsule_events (
  id          TEXT PRIMARY KEY,
  capsule_id  TEXT NOT NULL REFERENCES capsules(id),
  user_id     TEXT,
  event_type  TEXT NOT NULL,  -- impression, run, test_pass, test_fail
  metadata    TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- Pre-computed Stats (updated by cron)
CREATE TABLE capsule_stats (
  capsule_id      TEXT PRIMARY KEY,
  impressions     INTEGER DEFAULT 0,
  total_runs      INTEGER DEFAULT 0,
  completion_rate REAL DEFAULT 0,
  last_computed   TEXT
);
```

---

## Cost Projection (Updated)

### Monthly at Each Stage

| Stage | v1.0 (Old) | v2.0 (Actual) | Savings |
|-------|-----------|---------------|---------|
| Early (100 users) | ~$120 | ~$52 (VMSS $36 + AI $16) | **57%** |
| Growth (1K users) | ~$450 | ~$190 (VMSS $72 + AI $118) | **58%** |
| Scale (10K users) | ~$3,500 | ~$1,300 (VMSS $180 + AI $1,120) | **63%** |

### Credit Runway

| Provider | Credits | Monthly Burn | Runway |
|----------|---------|--------------|--------|
| Cloudflare | $10,000 | ~$16 | ~52 months |
| Azure | $1,000 | ~$171 (VMSS $36 + AI $135) | ~6 months |
| AWS | $250 | $0 (eliminated) | N/A |

---

## Implementation Status

### What's Deployed

| Component | Status | Details |
|-----------|--------|---------|
| Cloudflare Workers API (Hono) | Deployed | Routes: capsules, generate, execute, auth, analytics, mentor |
| Middleware chain | Deployed | Auth, rate-limit, error-handler, request-id, CORS, security headers |
| API versioning `/api/v1/` | Deployed | Legacy routes redirect to v1 |
| D1 database + schema | Deployed | users, capsules, capsule_events, capsule_stats, generation_logs |
| KV namespaces | Deployed | CACHE, SESSIONS, JOB_PROGRESS, RATE_LIMITS |
| Cloudflare Queue | Deployed | generation-queue + DLQ, batch=1, retries=3 |
| Queue consumer | Deployed | generation-consumer.ts, calls Azure OpenAI via tunnel |
| KV progress tracking | Deployed | 6+ progress stages (0%→5%→15%→90%→100%), polled via GET /generate/:id/status, 10-min TTL |
| Semantic caching | Deployed | Deduplication via prompt hash in CACHE KV |
| Circuit breaker | Deployed | system:circuit:generation key in CACHE |
| Execution router | Deployed | SQL at edge (D1), everything else to Piston via tunnel |
| Cloudflare Tunnel | Deployed | `codecapsule-piston` (ID: 78e0afda), HTTP/2, 4 connections to Mumbai |
| Azure VMSS | Deployed | 1x Standard_B2as_v2 (Central India), auto-scale 1-5 |
| Piston engine | Deployed | Docker, port 2000, Python/JS/Java/C/C++ verified |
| Dashboard (CF Pages) | Deployed | Next.js 14 static export, Supabase auth, Tailwind + Monaco Editor |
| R2 bucket | Bound | `devcapsules-assets` created but not actively used |
| Service bindings | Bound | JS_SANDBOX and PYTHON_SANDBOX worker bindings in wrangler.toml |
| Cron trigger | Configured | `*/15 * * * *` for analytics aggregation |

### What's NOT Built Yet

| Component | Original Plan | Priority | Notes |
|-----------|--------------|----------|-------|
| **OpenNext Migration** | Migrate dashboard from static export to Workers SSR | HIGH | Dashboard deployed to Pages as static export (`output: 'export'`); needs `@opennextjs/cloudflare` for SSR, API routes, server components |
| **WAF custom rules** | Custom DDoS/abuse rules for /execute endpoint | HIGH | Using Cloudflare defaults only; need body size limit + IP rate rule |
| **Dashboard API URL** | Fix stale AWS API Gateway reference | HIGH | `API_BASE_URL` in wrangler.toml still points to old AWS endpoint |
| **Auth integration** | Dashboard uses Supabase, Worker uses JWT | HIGH | Need to connect both auth systems |
| **Pre-parse body limit** | Add body size middleware before JSON parse | MEDIUM | 50KB source_code check only after full parse — no pre-parse protection |
| **Sandbox Workers** | Separate JS + Python sandbox workers | LOW | Code exists but not deployed; not needed since Piston handles all execution |
| **Durable Objects** | Stateful sandbox + WebSocket sessions | LOW | Not implemented; current architecture doesn't need them |
| **Cloudflare Analytics Engine** | Real-time analytics | LOW | Using D1-based analytics instead; works fine at current scale |
| **R2 asset storage** | Store generated capsule assets | MEDIUM | Bucket bound but no upload/download logic |

---

## Remaining Work — Roadmap

### Phase 1: Dashboard + Security (Priority: HIGH)

Dashboard is deployed to Cloudflare Pages as a **static export** but needs migration to Workers for full Next.js SSR support, and API URL needs fixing.

**Tasks:**
- [x] Deploy `apps/dashboard` to Cloudflare Pages (static export — done)
- [ ] Fix `API_BASE_URL` in wrangler.toml (currently stale AWS endpoint)
- [ ] Migrate from static export to OpenNext (`@opennextjs/cloudflare`) for SSR + API routes
- [ ] Set up WAF custom rules for /execute (body size limit + IP rate limiting)
- [ ] Add pre-parse body limit middleware to Workers
- [ ] Connect Supabase auth (dashboard) with Workers JWT auth
- [ ] Test end-to-end: login -> create capsule -> generate -> execute
- [ ] Set up custom domain (e.g., `app.devcapsules.com`)

### Phase 2: Auth Unification (Priority: HIGH)

Dashboard uses Supabase auth, Workers use JWT + KV sessions. These need to work together.

**Options:**
1. **Supabase JWT verification in Workers** — Workers validate Supabase JWTs directly
2. **Token exchange** — Dashboard exchanges Supabase token for Workers JWT
3. **Drop Supabase** — Move to Workers-only auth with KV sessions

**Tasks:**
- [ ] Decide auth strategy (option 1 recommended — least code change)
- [ ] Implement Supabase JWT verification in Workers auth middleware
- [ ] Test protected routes from dashboard

### Phase 3: Production Hardening (Priority: MEDIUM)

- [ ] Add Cloudflare Access (zero-trust) for admin routes
- [ ] Implement R2 asset upload for capsule images/attachments
- [ ] Set up alerting (Cloudflare notifications for error spikes)
- [ ] Add structured logging to Workers (currently basic console.log)
- [ ] Set up `wrangler tail` monitoring in CI/CD
- [ ] Update cloud-init to use config-file cloudflared (already fixed locally)

### Phase 4: Cleanup (Priority: LOW)

- [ ] Remove `apps/lambda-executor/` (AWS eliminated)
- [ ] Remove `apps/workers-python-sandbox/` and `apps/workers-js-sandbox/` (Piston handles all)
- [ ] Remove old `infrastructure/` CDK stack (AWS references)
- [ ] Set up git + CI/CD pipeline
- [ ] Clean up unused service bindings (JS_SANDBOX, PYTHON_SANDBOX) from wrangler.toml

---

## Issues Resolved

| Original Audit Finding | Status | How |
|------------------------|--------|-----|
| Single EC2 SPOF | Resolved | VMSS auto-scale 1-5 + Workers at edge |
| 30s gateway timeout | Resolved | Async Queue (15 min consumer timeout) |
| No auto-scaling | Resolved | Workers infinite + VMSS CPU-based scaling |
| No redundancy | Resolved | 300+ edge locations + multi-VM VMSS |
| Exposed infra details | Resolved | Secrets in Worker env vars |
| No API auth | Resolved | JWT + API key middleware |
| No rate limiting | Resolved | Per-user, per-plan limits via KV |
| Over-provisioned Lambda | Resolved | Workers (128MB) + right-sized VMSS |
| No caching | Resolved | KV cache layer + semantic dedup |
| No observability | Partial | Structured logging exists; CF Analytics Engine not integrated |
| No API versioning | Resolved | `/api/v1/` prefix with legacy redirect |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Azure VMSS single-region | Medium | VMSS in Central India only; could add second region later |
| QUIC blocked in Azure VNet | Resolved | cloudflared uses HTTP/2 protocol (not QUIC) |
| D1 SQLite limitations | Medium | Keep JSON as TEXT; migrate to Postgres/Turso at scale |
| Cloudflare lock-in | Medium | Workers use standard Web APIs (portable) |
| Azure credit exhaustion (~6 mo) | High | Semantic caching, GPT-4o-mini, quotas, monitor burn rate |
| Supabase + Workers auth mismatch | Medium | Needs unification (Phase 2 above) |
| No git/CI-CD | Medium | Manual deploys only; set up git + GitHub Actions |

---

## Infrastructure Details

### Cloudflare Tunnel
- **Name:** `codecapsule-piston`
- **ID:** `78e0afda-5c93-4ad7-b59d-ec44b5af8a1b`
- **DNS:** `tunnel.devcapsules.com` (CNAME)
- **Protocol:** HTTP/2 (QUIC blocked in Azure VNet)
- **Connections:** 4x to Mumbai PoPs (bom03, bom06, bom08, bom09, bom10)

### Azure VMSS
- **Name:** `codecapsule-piston` in `codecapsule-rg`
- **Region:** Central India
- **SKU:** Standard_B2as_v2 (2 vCPU, 8 GB RAM, ~$36/month)
- **Scale:** 1 min, 5 max (CPU >70% up, <30% down)
- **OS:** Ubuntu 22.04 LTS
- **Network:** VNet `10.0.0.0/16`, Subnet `10.0.1.0/24`, NSG denies all inbound

### Piston Runtimes
| Language | Version | Piston Package | Verified |
|----------|---------|---------------|----------|
| Python | 3.10.0 | python | Yes (18ms) |
| JavaScript | 18.15.0 | node | Yes (39ms) |
| Java | 15.0.2 | java | Yes (610ms) |
| C | 10.2.0 | gcc | Yes (7ms + 80ms compile) |
| C++ | 10.2.0 | gcc | Yes (7ms + 315ms compile) |

### Cloudflare Workers
- **API:** `devcapsules-api` at `https://devcapsules-api.devleep-edu.workers.dev`
- **Bindings:** D1, 4x KV, Queue, R2, 2x Service (unused)
- **Cron:** Every 15 minutes (analytics aggregation)

---

*Architecture last validated: February 16, 2026. Infrastructure deployed and smoke-tested.*
