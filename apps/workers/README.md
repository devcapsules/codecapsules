# DevCapsules Workers

Cloudflare Workers API for DevCapsules — the edge-first, serverless architecture.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Workers                         │
│                                                              │
│  Main API Router                                             │
│  ├── /health              → Health check                     │
│  ├── /api/v1/capsules/*   → CRUD (D1 database)              │
│  ├── /api/v1/generate     → Async generation (Queue)         │
│  ├── /api/v1/execute      → Code execution (Hybrid)          │
│  ├── /api/v1/analytics/*  → Analytics (D1 + KV)             │
│  └── /api/v1/auth/*       → Auth (JWT + API keys)            │
│                                                              │
│  Middleware: [CORS] → [Rate Limit] → [Auth] → [Route]       │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Setup

### Prerequisites

- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with Workers enabled

### 1. Install Dependencies

```bash
cd apps/workers
npm install
```

### 2. Create Cloudflare Resources

```bash
# Login to Cloudflare
wrangler login

# Create KV namespace
wrangler kv:namespace create KV
# Copy the ID to wrangler.toml

# Create D1 database
wrangler d1 create devcapsules-db
# Copy the database_id to wrangler.toml

# Create Queue
wrangler queues create generation-jobs
wrangler queues create generation-dlq

# Create R2 bucket (optional, for assets)
wrangler r2 bucket create devcapsules-assets
```

### 3. Update wrangler.toml

Replace all `REPLACE_WITH_*` placeholders with actual IDs from step 2.

### 4. Set Secrets

```bash
# Azure OpenAI
wrangler secret put AZURE_OPENAI_API_KEY

# JWT signing key (generate a strong random string)
wrangler secret put JWT_SECRET

# AWS Lambda executor key (if using heavy language execution)
wrangler secret put AWS_EXECUTOR_API_KEY
```

### 5. Run Database Migration

```bash
# Local development
wrangler d1 migrations apply devcapsules-db --local

# Production
wrangler d1 migrations apply devcapsules-db
```

### 6. Deploy

```bash
# Development (uses local D1, KV)
npm run dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

## 🛠️ Development

### Local Development

```bash
npm run dev
```

This starts a local Worker with:
- Local D1 SQLite database
- Local KV namespace
- Hot reloading

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## 📚 API Reference

### Authentication

**JWT Token** (for dashboard users):
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**API Key** (for embed widget):
```
Authorization: Bearer dk_a1b2c3d4e5f6...
```

### Endpoints

#### Health Check
```http
GET /health
```

#### Generate Capsule (Async)
```http
POST /api/v1/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "prompt": "Create a function to reverse a string",
  "language": "python",
  "difficulty": "medium"
}
```

Response:
```json
{
  "success": true,
  "jobId": "gen_1234567890_abcd1234",
  "statusUrl": "/api/v1/generate/gen_1234567890_abcd1234/status"
}
```

#### Check Generation Status
```http
GET /api/v1/generate/:jobId/status
```

#### Execute Code
```http
POST /api/v1/execute
Content-Type: application/json

{
  "source_code": "print('Hello World')",
  "language": "python",
  "time_limit": 10
}
```

#### Run Tests
```http
POST /api/v1/execute/tests
Content-Type: application/json

{
  "userCode": "def add(a, b): return a + b",
  "testCases": [...],
  "language": "python",
  "functionName": "add"
}
```

## 🔐 Security

### Rate Limits

| Plan | Requests/min | Requests/day |
|------|-------------|--------------|
| free | 10 | 100 |
| creator | 60 | 5,000 |
| team | 300 | 25,000 |
| enterprise | 1,000 | unlimited |

### Generation Limits

| Plan | Generations/day |
|------|----------------|
| free | 5 |
| creator | 100 |
| team | 500 |
| enterprise | unlimited |

## 📊 Observability

Logs are structured JSON for easy parsing:

```json
{
  "level": "info",
  "action": "generation_complete",
  "jobId": "gen_123",
  "qualityScore": 0.87,
  "generationTime": 15432,
  "timestamp": "2026-02-13T12:00:00.000Z"
}
```

View logs:
```bash
wrangler tail
```

## 🚀 Deployment

### Environments

| Environment | URL |
|------------|-----|
| Development | `http://localhost:8787` |
| Staging | `https://devcapsules-api-staging.<account>.workers.dev` |
| Production | `https://api.devcapsules.com` |

### Custom Domain

```bash
wrangler domains add api.devcapsules.com
```

## 📁 Project Structure

```
apps/workers/
├── migrations/
│   └── 0001_initial_schema.sql
├── src/
│   ├── index.ts              # Main entry point
│   ├── middleware/
│   │   ├── auth.ts           # JWT + API key auth
│   │   ├── rate-limit.ts     # Rate limiting
│   │   ├── error-handler.ts  # Error handling
│   │   └── request-id.ts     # Request tracing
│   ├── routes/
│   │   ├── capsules.ts       # CRUD operations
│   │   ├── generate.ts       # Async generation
│   │   ├── execute.ts        # Code execution
│   │   ├── auth.ts           # Login/register
│   │   └── analytics.ts      # Analytics
│   └── queues/
│       └── generation-consumer.ts
├── worker-configuration.d.ts # TypeScript types
├── wrangler.toml             # Cloudflare config
├── package.json
└── tsconfig.json
```

## 💰 Cost Estimation

| Usage Level | Workers | D1 | KV | Queues | Total |
|-------------|---------|----|----|--------|-------|
| 100 users/mo | ~$0 | ~$0 | ~$0 | ~$0 | **~$0** (free tier) |
| 1K users/mo | ~$5 | ~$2 | ~$1 | ~$0.50 | **~$8.50** |
| 10K users/mo | ~$25 | ~$15 | ~$8 | ~$5 | **~$53** |

*Does not include Azure OpenAI costs (~$0.027/generation)*
