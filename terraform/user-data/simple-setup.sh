#!/bin/bash

# CodeCapsule Piston + Queue Worker Setup
set -e

log() {
    echo "$(date "+%Y-%m-%d %H:%M:%S") - $1" | tee -a /var/log/codecapsule-setup.log
}

log "Starting CodeCapsule setup..."

# Update system and install essentials
apt-get update -y
apt-get install -y docker.io nodejs npm curl wget git jq

# Start and configure Docker
systemctl start docker
systemctl enable docker
usermod -aG docker ubuntu

# Pull and run Piston (no gVisor due to complexity)
log "Starting Piston..."
docker pull ghcr.io/engineer-man/piston:latest
docker run -d \
    --name piston \
    --restart always \
    -p 2000:2000 \
    --privileged \
    -e PISTON_DISABLE_NETWORKING=true \
    -e PISTON_MAX_PROCESS_COUNT=64 \
    -e PISTON_MEMORY_LIMIT=268435456 \
    -v /tmp/piston:/piston/jobs:rw \
    ghcr.io/engineer-man/piston:latest

# Wait for Piston to start
sleep 15

# Test Piston
log "Testing Piston API..."
if curl -s http://localhost:2000/api/v2/runtimes | jq . > /dev/null; then
    log "✅ Piston API is responding"
else
    log "❌ Piston API test failed"
fi

# Install queue worker
log "Installing Queue Worker..."
WORKER_DIR="/opt/codecapsule-worker"
mkdir -p $WORKER_DIR
cd $WORKER_DIR

# Create package.json
cat > package.json << "EOF"
{
  "name": "codecapsule-queue-worker",
  "version": "1.0.0",
  "main": "queue-worker.js",
  "dependencies": {
    "@supabase/supabase-js": "^2.38.5",
    "@upstash/redis": "^1.25.1",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.1"
  }
}
EOF

npm install

# Create simplified queue worker
cat > queue-worker.js << "EOF"
const { Redis } = require('@upstash/redis');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class QueueWorker {
  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }

  async start() {
    console.log("🚀 Queue Worker starting...");
    console.log("📡 Redis: " + (process.env.UPSTASH_REDIS_URL ? "Configured" : "Not configured"));
    console.log("🗄️ Supabase: " + (process.env.SUPABASE_URL ? "Configured" : "Not configured"));

    while (true) {
      try {
        const result = await this.redis.brpop('execution_queue', 0);
        if (!result || !result[1]) continue;

        const job = JSON.parse(result[1]);
        console.log("📋 Processing job: " + job.id + " (" + job.language + ")");

        const execResult = await this.executeCode(job);
        
        await this.supabase.channel("job-" + job.id).send({
          type: "broadcast",
          event: "job_update",
          payload: { jobId: job.id, status: "completed", result: execResult }
        });

        console.log("✅ Job completed: " + job.id);

      } catch (error) {
        console.error("❌ Worker error:", error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  async executeCode(job) {
    try {
      const response = await axios.post('http://localhost:2000/api/v2/execute', {
        language: job.language,
        version: this.getVersion(job.language),
        files: [{ name: this.getFileName(job.language), content: job.code }],
        stdin: job.input || "",
        compile_timeout: 10000,
        run_timeout: 30000
      }, { timeout: 45000 });

      return {
        success: response.data.run?.code === 0,
        stdout: response.data.run?.stdout || "",
        stderr: response.data.run?.stderr || "",
        exitCode: response.data.run?.code || 0,
        language: job.language
      };
    } catch (error) {
      return {
        success: false,
        stdout: "",
        stderr: error.message,
        exitCode: 1,
        language: job.language
      };
    }
  }

  getVersion(language) {
    const versions = {
      python: "3.10.0", javascript: "18.15.0", typescript: "5.0.3",
      go: "1.16.2", java: "15.0.2", cpp: "10.2.0", c: "10.2.0",
      csharp: "6.12.0", php: "8.2.3", ruby: "3.0.1", rust: "1.68.2"
    };
    return versions[language] || versions.python;
  }

  getFileName(language) {
    const extensions = {
      python: "main.py", javascript: "main.js", typescript: "main.ts",
      java: "Main.java", cpp: "main.cpp", c: "main.c", csharp: "main.cs",
      go: "main.go", php: "main.php", ruby: "main.rb", rust: "main.rs"
    };
    return extensions[language] || "main.txt";
  }
}

if (require.main === module) {
  const worker = new QueueWorker();
  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));
  worker.start().catch(console.error);
}

module.exports = QueueWorker;
EOF

# Create environment template
cat > .env << "EOF"
# UPDATE THESE WITH REAL VALUES
UPSTASH_REDIS_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_TOKEN=your-redis-token
SUPABASE_URL=https://dinerkhhhoibcrznysen.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpbmVya2hoaG9pYmNyem55c2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzODE3NSwiZXhwIjoyMDc2NzE0MTc1fQ.WNEVUApyZZa7LHOT0gCVUta6rTc7v1wVAynbxA02tsQ
PISTON_URL=http://localhost:2000
EOF

# Set ownership
chown -R ubuntu:ubuntu $WORKER_DIR

# Create systemd service
cat > /etc/systemd/system/codecapsule-worker.service << "EOF"
[Unit]
Description=CodeCapsule Queue Worker
After=docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/codecapsule-worker
ExecStart=/usr/bin/node queue-worker.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/codecapsule-worker/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable codecapsule-worker

log "✅ Setup complete! Update .env with Redis credentials then start: systemctl start codecapsule-worker"