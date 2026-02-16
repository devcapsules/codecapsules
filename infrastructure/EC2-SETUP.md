# CodeCapsule EC2 Setup Guide

## Phase 1: Infrastructure Setup

### Prerequisites
- AWS CLI installed and configured (`aws configure`)
- EC2 Key Pair created (or will create new one)

### Step 1: Launch EC2 Instance

```powershell
# Navigate to infrastructure directory
cd infrastructure

# Launch with default settings (t3.small)
.\launch-ec2.ps1

# Or specify custom instance type
.\launch-ec2.ps1 -InstanceType "t3.medium" -KeyPairName "your-key-name"
```

### Step 2: Verify Setup (after 2-3 minutes)

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@PUBLIC_IP

# Test Piston is working
./test-piston.sh

# Check overall status  
./check-status.sh
```

Expected output from test:
```json
{
  "language": "python",
  "version": "3.10.0",
  "run": {
    "stdout": "Hello from CodeCapsule!\n",
    "stderr": "",
    "code": 0,
    "signal": null
  }
}
```

### What the Setup Installs

1. **Docker** - Container runtime
2. **gVisor (runsc)** - Security layer for container isolation
3. **Piston** - Multi-language code execution engine
4. **PM2** - Process manager for the worker
5. **Security configuration** - Firewall and network isolation

### Security Features

- **gVisor**: User-space kernel for container isolation
- **Network disabled**: `PISTON_DISABLE_NETWORKING=true`
- **Resource limits**: Memory (1GB) and CPU (2 cores) constraints
- **Firewall**: Only SSH access allowed
- **Privileged mode**: Required for Piston sandboxing but contained by gVisor

### Troubleshooting

**If Piston test fails:**
```bash
# Check Piston container status
docker ps --filter name=piston

# View Piston logs
docker logs piston

# Restart Piston if needed
docker restart piston
```

**If gVisor causes issues:**
```bash
# Fallback: Run Piston with standard Docker runtime
docker stop piston
docker rm piston

docker run -d \
  --name piston \
  --restart always \
  --privileged \
  -p 2000:2000 \
  -e PISTON_DISABLE_NETWORKING=true \
  ghcr.io/engineer-man/piston:latest
```

### Next Phase: Worker Setup

Once EC2 is ready, proceed to Phase 2:
1. Set up Redis queue worker
2. Configure environment variables
3. Install Node.js dependencies
4. Start the worker process

### Cost Estimate

- **t3.small**: ~$15-20/month
- **t3.medium**: ~$30-35/month  
- **Data transfer**: Minimal (API calls)
- **Total**: Much cheaper than Lambda for high-volume usage