#!/bin/bash
# CodeCapsule EC2 Setup: Docker + gVisor + Piston
# This script automatically configures a secure code execution environment

set -e  # Exit on any error

echo "🚀 Starting CodeCapsule EC2 setup..."

# 1. Update system and install dependencies
echo "📦 Installing system dependencies..."
apt-get update -y
apt-get install -y docker.io nodejs npm unzip curl wget gnupg2 software-properties-common

# Start and enable Docker
systemctl start docker
systemctl enable docker
usermod -aG docker ubuntu  # Allow ubuntu user to run docker

echo "✅ Docker installed and started"

# 2. Install gVisor (Security Layer)
echo "🛡️ Installing gVisor for enhanced security..."
curl -fsSL https://gvisor.dev/archive.key | gpg --dearmor -o /usr/share/keyrings/gvisor-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/gvisor-archive-keyring.gpg] https://storage.googleapis.com/gvisor/releases release main" | tee /etc/apt/sources.list.d/gvisor.list > /dev/null

apt-get update -y
apt-get install -y runsc

echo "✅ gVisor (runsc) installed"

# 3. Configure Docker to use gVisor runtime
echo "🔧 Configuring Docker with gVisor runtime..."
cat <<EOF > /etc/docker/daemon.json
{
    "runtimes": {
        "runsc": {
            "path": "/usr/bin/runsc"
        }
    },
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF

# Restart Docker to apply configuration
systemctl restart docker

echo "✅ Docker configured with gVisor runtime"

# 4. Wait for Docker to be ready
echo "⏳ Waiting for Docker to be ready..."
sleep 10

# 5. Run Piston with security configurations
echo "🏃 Starting Piston execution engine..."

# Pull Piston image first
docker pull ghcr.io/engineer-man/piston:latest

# Run Piston with network isolation and resource limits
docker run -d \
  --name piston \
  --restart always \
  --privileged \
  -p 2000:2000 \
  -e PISTON_DISABLE_NETWORKING=true \
  -e PISTON_MAX_MEMORY=256m \
  -e PISTON_MAX_CPU_TIME=5 \
  -e PISTON_MAX_WALL_TIME=10 \
  --memory=1g \
  --cpus=2 \
  ghcr.io/engineer-man/piston:latest

echo "✅ Piston started successfully"

# 6. Install PM2 for process management (for worker later)
echo "📊 Installing PM2 for process management..."
npm install -g pm2

# 7. Create working directory for the worker
mkdir -p /home/ubuntu/codecapsule-worker
chown ubuntu:ubuntu /home/ubuntu/codecapsule-worker

# 8. Set up basic firewall (optional but recommended)
echo "🔒 Configuring basic firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh

echo "✅ Firewall configured"

# 9. Create status check script
cat <<'EOF' > /home/ubuntu/check-status.sh
#!/bin/bash
echo "=== CodeCapsule Status ==="
echo "Docker Status: $(systemctl is-active docker)"
echo "Piston Container: $(docker ps --filter name=piston --format 'table {{.Names}}\t{{.Status}}')"
echo "Available Languages: $(curl -s http://localhost:2000/api/v2/runtimes | jq -r '.[].language' | head -10)"
echo "========================="
EOF

chmod +x /home/ubuntu/check-status.sh
chown ubuntu:ubuntu /home/ubuntu/check-status.sh

# 10. Create health check endpoint test
cat <<'EOF' > /home/ubuntu/test-piston.sh
#!/bin/bash
echo "🧪 Testing Piston..."
curl -X POST http://localhost:2000/api/v2/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "version": "3.10.0", 
    "files": [{"content": "print(\"Hello from CodeCapsule!\")"}]
  }'
echo ""
echo "✅ Test complete"
EOF

chmod +x /home/ubuntu/test-piston.sh
chown ubuntu:ubuntu /home/ubuntu/test-piston.sh

echo "🎉 CodeCapsule EC2 setup completed!"
echo "📍 Next steps:"
echo "1. SSH into instance: ssh -i your-key.pem ubuntu@$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "2. Test Piston: ./test-piston.sh"
echo "3. Check status: ./check-status.sh"

# Log completion
echo "$(date): CodeCapsule EC2 setup completed" >> /var/log/codecapsule-setup.log