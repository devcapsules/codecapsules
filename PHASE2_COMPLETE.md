# 🚀 CodeCapsule Phase 2 Complete Setup Guide

## ✅ Infrastructure Deployed Successfully

Your Piston + Queue Worker infrastructure has been deployed! Here's what we have:

### 🖥️ Server Information
- **Instance ID**: `i-0cb7ada5663f89731`
- **Public IP**: `18.232.38.134`
- **SSH Command**: `ssh -i codecapsule-key.pem ubuntu@18.232.38.134`

### 🐳 What's Installed
✅ **Docker + Piston**: Running on localhost:2000  
✅ **Queue Worker**: Installed at `/opt/codecapsule-worker/`  
✅ **Systemd Service**: `codecapsule-worker.service` (ready to start)  
✅ **Dependencies**: All Node.js packages installed  

## 🔧 Final Setup Steps

### 1. Create Redis Database (5 minutes)

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign in/create account
3. Click **Create Database**
4. Name: `codecapsule-queue`
5. Region: `us-east-1`
6. Type: `Regional`
7. Click **Create**

### 2. Get Your Credentials

After Redis creation, copy:
- **REST URL** → Your `UPSTASH_REDIS_URL`  
- **REST Token** → Your `UPSTASH_REDIS_TOKEN`

### 3. Configure EC2 Instance

SSH into your server:
```bash
ssh -i codecapsule-key.pem ubuntu@18.232.38.134
```

Update environment file:
```bash
sudo nano /opt/codecapsule-worker/.env
```

Replace the placeholder values:
```env
# Update these with your actual Redis credentials:
UPSTASH_REDIS_URL=https://your-actual-redis-url.upstash.io
UPSTASH_REDIS_TOKEN=your-actual-redis-token

# Supabase is already configured
SUPABASE_URL=https://dinerkhhhoibcrznysen.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpbmVya2hoaG9pYmNyem55c2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzODE3NSwiZXhwIjoyMDc2NzE0MTc1fQ.WNEVUApyZZa7LHOT0gCVUta6rTc7v1wVAynbxA02tsQ

# Piston is correctly configured for localhost
PISTON_URL=http://localhost:2000
```

### 4. Start the Queue Worker

```bash
# Start the service
sudo systemctl start codecapsule-worker

# Check status
sudo systemctl status codecapsule-worker

# View logs
sudo journalctl -u codecapsule-worker -f
```

### 5. Test the Setup

```bash
# Test Piston is running
curl -s http://localhost:2000/api/v2/runtimes | jq length

# Test Redis connection
cd /opt/codecapsule-worker
node -e "
const { Redis } = require('@upstash/redis');
require('dotenv').config();
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});
redis.ping().then(console.log).catch(console.error);
"
```

Expected output: `PONG` (means Redis is working)

## 🏗️ Next Phase: API Integration

Once the worker is running, you'll need to:

1. **Update your API** to use the queue system instead of direct Lambda calls
2. **Add queue endpoints** (`/api/v2/execute/:language`, `/api/v2/status/:jobId`)
3. **Switch frontend** to use async execution with real-time updates

## 📊 System Architecture

```
Frontend Request
      ↓
   API Server
      ↓ 
 Queue Job (Redis)
      ↓
 EC2 Queue Worker
      ↓
   Piston (Docker)
      ↓
Real-time Updates (Supabase)
      ↓
   Frontend
```

## 🔍 Monitoring Commands

```bash
# Worker status
sudo systemctl status codecapsule-worker

# Worker logs
sudo journalctl -u codecapsule-worker -f

# Piston status
docker ps | grep piston

# System resources
htop

# Redis queue length
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

## 💡 What This Solves

✅ **Scalability**: No more "only 1 of 100 widgets loads"  
✅ **Performance**: Direct Piston execution (no Lambda cold starts)  
✅ **Cost**: ~$20-40/month vs $200-500 for Judge0  
✅ **Reliability**: Queue system handles high load  
✅ **Real-time**: Users see execution progress live  

## 🎯 Production Ready Features

- ✅ Auto-scaling (1-3 instances)
- ✅ Container security (Docker isolation)
- ✅ Network isolation (port 2000 closed externally)
- ✅ Systemd service management
- ✅ Automatic restart on failure
- ✅ Proper logging and monitoring

---

**Status**: Infrastructure Complete ✅  
**Next**: Configure Redis → Start Worker → Update API