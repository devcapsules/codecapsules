# CodeCapsule Redis Setup Instructions

## Step 1: Create Upstash Redis Database

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign in or create account
3. Click **Create Database**
4. Configure:
   - **Name**: `codecapsule-queue`
   - **Region**: `us-east-1` (same as EC2)
   - **Type**: `Regional` (faster, cheaper)
   - **TLS**: `Enabled`
5. Click **Create**

## Step 2: Get Redis Credentials

After creation, go to your database details:

1. Copy **REST URL** → This is your `UPSTASH_REDIS_URL`
2. Copy **REST Token** → This is your `UPSTASH_REDIS_TOKEN`

Example format:
```
UPSTASH_REDIS_URL=https://us1-grateful-catfish-12345.upstash.io
UPSTASH_REDIS_TOKEN=AX12AbCdEfGhIjKlMnOpQrStUvWxYz...
```

## Step 3: Update Environment Variables

SSH into your EC2 instance:
```bash
ssh -i codecapsule-key.pem ubuntu@44.222.105.71
```

Edit the environment file:
```bash
sudo nano /opt/codecapsule-worker/.env
```

Update these lines with your actual values:
```bash
UPSTASH_REDIS_URL=https://your-actual-redis-url.upstash.io
UPSTASH_REDIS_TOKEN=your-actual-redis-token
```

## Step 4: Test Redis Connection

Test the connection:
```bash
cd /opt/codecapsule-worker
node -e "
const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});
redis.ping().then(console.log).catch(console.error);
"
```

Should output: `PONG`

## Step 5: Start Queue Worker

```bash
sudo systemctl start codecapsule-worker
sudo systemctl status codecapsule-worker
```

Monitor logs:
```bash
sudo journalctl -u codecapsule-worker -f
```

## Pricing

- Upstash Redis: Free tier includes 10K requests/day
- Perfect for development and light production usage
- Upgrade as needed ($0.20 per 100K requests)

## Verification Commands

Check if everything is working:
```bash
# Check worker status
sudo systemctl status codecapsule-worker

# Check worker logs  
sudo journalctl -u codecapsule-worker --since "5 minutes ago"

# Check Piston health
curl http://localhost:2000/api/v2/runtimes

# Test queue length
cd /opt/codecapsule-worker && node -e "
const { Redis } = require('@upstash/redis');
require('dotenv').config();
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});
redis.llen('execution_queue').then(console.log);
"
```