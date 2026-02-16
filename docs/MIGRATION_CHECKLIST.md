# Migration Checklist: v1 → v2 Architecture

Quick checklist for migrating from AWS-centric to Cloudflare-first architecture.

## Pre-Migration

- [ ] **Backup existing data** from Neon PostgreSQL
- [ ] **Document current API endpoints** being used
- [ ] **Get Cloudflare account** credentials ready
- [ ] **Get Azure OpenAI** API key and endpoint
- [ ] **Review current AWS credits** - $250 remaining

---

## Phase 1: Setup (Day 1)

### Cloudflare Setup
- [ ] Create Cloudflare account (if not exists)
- [ ] Add domain to Cloudflare
- [ ] Install Wrangler CLI: `npm install -g wrangler`
- [ ] Login: `wrangler login`

### Create Resources
```bash
# Run these commands:
wrangler d1 create devcapsules-db
wrangler kv namespace create "CACHE"
wrangler kv namespace create "SESSIONS"
wrangler kv namespace create "JOB_PROGRESS"
wrangler kv namespace create "RATE_LIMITS"
wrangler queues create generation-queue
wrangler queues create generation-queue-dlq
```
- [ ] Copy IDs to `wrangler.toml`

---

## Phase 2: Deploy Workers (Day 1-2)

### Database
- [ ] Run migrations: `wrangler d1 execute devcapsules-db --remote --file=./migrations/0001_initial_schema.sql`
- [ ] Verify tables created

### Workers
- [ ] Deploy main API: `cd apps/workers && pnpm run deploy:production`
- [ ] Deploy Python sandbox: `cd apps/workers-python-sandbox && pnpm run deploy`
- [ ] Deploy JS sandbox: `cd apps/workers-js-sandbox && pnpm run deploy`

### Secrets
```bash
wrangler secret put AZURE_OPENAI_API_KEY
wrangler secret put AZURE_OPENAI_ENDPOINT
wrangler secret put JWT_SECRET
wrangler secret put AWS_EXECUTOR_API_KEY
```
- [ ] All secrets set

### Verify
- [ ] Health check returns success: `curl https://api.devcapsules.com/health`

---

## Phase 3: Deploy Lambda Executor (Day 2)

- [ ] Build Docker image
- [ ] Push to ECR
- [ ] Create Lambda function
- [ ] Configure Function URL
- [ ] Set API_KEY environment variable
- [ ] Test Java execution
- [ ] Test C++ execution

---

## Phase 4: DNS & Routing (Day 2)

- [ ] Add CNAME record: `api` → Workers
- [ ] Configure custom domain in Workers
- [ ] Enable HTTPS
- [ ] Test from different regions

---

## Phase 5: Dashboard Update (Day 3)

### Environment Variables (Vercel)
- [ ] Set `NEXT_PUBLIC_WORKERS_API_URL=https://api.devcapsules.com`
- [ ] Remove old API URL variables
- [ ] Redeploy dashboard

### Testing
- [ ] Login/Register works
- [ ] Capsule generation works
- [ ] Code execution works
- [ ] Analytics load correctly

---

## Phase 6: Monitor & Validate (Day 3-7)

### Daily Checks
- [ ] Check Workers analytics (error rate < 1%)
- [ ] Check D1 metrics (within free tier)
- [ ] Check Queue depth (no backlog)
- [ ] Monitor Azure OpenAI usage

### User Testing
- [ ] Test full flow from landing to capsule completion
- [ ] Test embed widget on external site
- [ ] Test API key authentication

---

## Phase 7: Decommission Old Infra (Day 14+)

**Only after 1 week of stable operation:**

- [ ] Stop old EC2 Piston instance
- [ ] Delete old API Gateway
- [ ] Delete old Lambda functions
- [ ] Cancel unused Neon database (keep backup)
- [ ] Update documentation

---

## Cost Tracking

| Service | Before (Monthly) | After (Monthly) | Savings |
|---------|------------------|-----------------|---------|
| Compute | ~$50 (EC2+Lambda) | ~$0 (Workers free) | $50 |
| Database | ~$20 (Neon) | ~$0 (D1 free) | $20 |
| API Gateway | ~$10 | ~$0 (Workers) | $10 |
| AI | ~$30 | ~$16 (GPT-4o-mini) | $14 |
| **Total** | **~$120** | **~$16** | **$104 (87%)** |

---

## Rollback Plan

If issues occur:

1. **Quick rollback**: Change DNS back to old Lambda Function URL
2. **Dashboard rollback**: Revert Vercel environment variables
3. **Data recovery**: Restore from Neon backup

---

## Success Criteria

✅ **Deployment successful when:**
- Health check returns 200
- < 1% error rate for 24 hours
- Generation completes in < 60 seconds
- Execution completes in < 5 seconds (edge) or < 30 seconds (Lambda)
- All dashboard features work
- Costs tracking at < $20/month
