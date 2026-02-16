#!/bin/bash

# CodeCapsule Piston Execution Server Setup
# This script installs Docker + gVisor + Piston + Worker

set -e

# Logging function
log() {
    echo "$(date "+%Y-%m-%d %H:%M:%S") - $1" | tee -a /var/log/codecapsule-setup.log
}

log "Starting CodeCapsule Piston server setup..."

# Update system packages
log "Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install essential packages
log "Installing essential packages..."
apt-get install -y \
    docker.io \
    nodejs \
    npm \
    unzip \
    curl \
    wget \
    htop \
    git \
    jq

# Start and enable Docker
log "Starting Docker service..."
systemctl start docker
systemctl enable docker

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Install gVisor for enhanced security
log "Installing gVisor (runsc)..."
curl -fsSL https://gvisor.dev/archive.key | gpg --dearmor -o /usr/share/keyrings/gvisor-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/gvisor-archive-keyring.gpg] https://storage.googleapis.com/gvisor/releases release main" | tee /etc/apt/sources.list.d/gvisor.list > /dev/null
apt-get update && apt-get install -y runsc

# Configure Docker to use gVisor runtime
log "Configuring Docker with gVisor runtime..."
cat > /etc/docker/daemon.json << "EOF"
{
    "runtimes": {
        "runsc": {
            "path": "/usr/bin/runsc",
            "runtimeArgs": [
                "--ignore-cgroups"
            ]
        }
    },
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF

# Restart Docker to apply gVisor configuration
log "Restarting Docker with new configuration..."
systemctl restart docker

# Wait for Docker to be ready
sleep 10

# Test gVisor installation
log "Testing gVisor installation..."
if docker run --rm --runtime=runsc hello-world > /dev/null 2>&1; then
    log "✅ gVisor is working correctly"
    USE_GVISOR="--runtime=runsc"
else
    log "⚠️  gVisor test failed, falling back to standard Docker runtime"
    USE_GVISOR=""
fi

# Pull and run Piston with security configurations
log "Starting Piston execution engine..."
docker pull ghcr.io/engineer-man/piston:latest

# Run Piston with security settings
# Note: If gVisor fails, we fall back to standard runtime with network isolation
docker run -d \
    --name piston \
    --restart always \
    -p 2000:2000 \
    $USE_GVISOR \
    --privileged \
    -e PISTON_DISABLE_NETWORKING=true \
    -e PISTON_MAX_PROCESS_COUNT=64 \
    -e PISTON_MAX_OPEN_FILES=2048 \
    -e PISTON_MAX_FILE_SIZE=10000000 \
    -e PISTON_MEMORY_LIMIT=268435456 \
    -v /tmp/piston:/piston/jobs:rw \
    ghcr.io/engineer-man/piston:latest

# Wait for Piston to start
log "Waiting for Piston to initialize..."
sleep 15

# Test Piston installation
log "Testing Piston API..."
if curl -s http://localhost:2000/api/v2/runtimes | jq . > /dev/null 2>&1; then
    log "✅ Piston API is responding correctly"
else
    log "❌ Piston API test failed"
    docker logs piston
fi

# Create worker directory and install dependencies
log "Setting up worker environment..."
mkdir -p /home/ubuntu/worker
cd /home/ubuntu/worker

# Create package.json for worker
cat > package.json << "EOF"
{
  "name": "codecapsule-worker",
  "version": "1.0.0",
  "description": "CodeCapsule execution worker",
  "main": "worker.js",
  "scripts": {
    "start": "node worker.js",
    "dev": "node worker.js"
  },
  "dependencies": {
    "@upstash/redis": "^1.25.1",
    "@supabase/supabase-js": "^2.38.5",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1"
  }
}
EOF

# Install Node.js dependencies
log "Installing Node.js dependencies..."
npm install

# Create the worker script
cat > worker.js << "EOF"
const { Redis } = require("@upstash/redis");
const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");
require("dotenv").config();

// Configuration
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const PISTON_URL = "http://localhost:2000/api/v2/execute";

// Language version mapping (keep synced with frontend)
const LANGUAGE_VERSIONS = {
  python: "3.10.0",
  javascript: "18.15.0",
  typescript: "5.0.3",
  go: "1.16.2",
  java: "15.0.2",
  cpp: "10.2.0",
  c: "10.2.0",
  csharp: "6.12.0",
  php: "8.2.3",
  ruby: "3.0.1",
  rust: "1.68.2"
};

console.log("🚀 CodeCapsule Worker started. Listening for execution jobs...");
console.log(`📡 Redis: ${process.env.UPSTASH_REDIS_URL ? "Connected" : "Not configured"}`);
console.log(`🗄️  Supabase: ${process.env.SUPABASE_URL ? "Connected" : "Not configured"}`);

async function processQueue() {
  while (true) {
    try {
      // Block and wait for job from Redis queue
      const data = await redis.blpop("execution_queue", 0);
      
      if (!data || !data[1]) {
        console.log("⚠️  Received empty job from queue");
        continue;
      }

      const job = JSON.parse(data[1]);
      console.log(`📋 Processing job: ${job.id} (${job.language})`);

      // Validate job data
      if (!job.code || !job.language) {
        console.error(`❌ Invalid job data:`, job);
        await notifyError(job.id, "Invalid job data: missing code or language");
        continue;
      }

      // Execute code with Piston
      const startTime = Date.now();
      const result = await axios.post(PISTON_URL, {
        language: job.language,
        version: LANGUAGE_VERSIONS[job.language] || LANGUAGE_VERSIONS.python,
        files: [{ 
          name: getFileName(job.language),
          content: job.code 
        }],
        stdin: job.input || "",
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_memory_limit: 128000000,
        run_memory_limit: 128000000
      }, {
        timeout: 15000 // 15 second timeout
      });

      const executionTime = Date.now() - startTime;
      
      // Extract execution results
      const output = result.data.run?.output || result.data.run?.stdout || "";
      const stderr = result.data.run?.stderr || "";
      const exitCode = result.data.run?.code || 0;

      // Broadcast result via Supabase
      await supabase.channel(`job-${job.id}`).send({
        type: "broadcast",
        event: "result",
        payload: { 
          success: true,
          output: output,
          stderr: stderr,
          exitCode: exitCode,
          executionTime: executionTime,
          language: job.language
        }
      });

      console.log(`✅ Job ${job.id} completed in ${executionTime}ms`);

    } catch (err) {
      console.error("❌ Execution failed:", err.message);
      
      // Try to extract job ID for error notification
      let jobId = "unknown";
      try {
        if (err.config?.data) {
          const jobData = JSON.parse(err.config.data);
          jobId = jobData.id || "unknown";
        }
      } catch (parseErr) {
        // Ignore parsing errors
      }

      await notifyError(jobId, err.message);
    }
  }
}

async function notifyError(jobId, errorMessage) {
  try {
    await supabase.channel(`job-${jobId}`).send({
      type: "broadcast",
      event: "result",
      payload: { 
        success: false,
        error: errorMessage,
        output: "",
        stderr: errorMessage
      }
    });
  } catch (notifyErr) {
    console.error("❌ Failed to notify error:", notifyErr.message);
  }
}

function getFileName(language) {
  const extensions = {
    python: "main.py",
    javascript: "main.js",
    typescript: "main.ts",
    java: "Main.java",
    cpp: "main.cpp",
    c: "main.c",
    csharp: "main.cs",
    go: "main.go",
    php: "main.php",
    ruby: "main.rb",
    rust: "main.rs"
  };
  return extensions[language] || "main.txt";
}

// Start processing queue
processQueue().catch(err => {
  console.error("💥 Worker crashed:", err);
  process.exit(1);
});
EOF

# Create environment file with placeholder values (to be updated manually)
cat > .env << "EOF"
# Redis Configuration (Upstash) - UPDATE THESE VALUES
UPSTASH_REDIS_URL=https://placeholder.upstash.io
UPSTASH_REDIS_TOKEN=placeholder-token

# Supabase Configuration - UPDATE THESE VALUES
SUPABASE_URL=https://dinerkhhhoibcrznysen.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpbmVya2hoaG9pYmNyem55c2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzODE3NSwiZXhwIjoyMDc2NzE0MTc1fQ.WNEVUApyZZa7LHOT0gCVUta6rTc7v1wVAynbxA02tsQ
EOF

# Set proper ownership
chown -R ubuntu:ubuntu /home/ubuntu/worker

# Install PM2 globally for process management
log "Installing PM2 for process management..."
npm install -g pm2

# Start worker with PM2 (as ubuntu user)
log "Starting worker process with PM2..."
sudo -u ubuntu bash -c "cd /home/ubuntu/worker && pm2 start worker.js --name codecapsule-worker"
sudo -u ubuntu pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo -u ubuntu pm2 save

# Create startup service to ensure PM2 starts on boot
systemctl enable pm2-ubuntu

# Setup log rotation
cat > /etc/logrotate.d/codecapsule << "EOF"
/var/log/codecapsule-setup.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    copytruncate
}
EOF

# Create health check script
cat > /home/ubuntu/health-check.sh << "EOF"
#!/bin/bash
# Health check script for monitoring

echo "=== CodeCapsule Health Check ==="
echo "Date: $(date)"
echo

echo "🐳 Docker Status:"
systemctl is-active docker

echo "📦 Piston Container:"
docker ps --filter name=piston --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "🔌 Piston API:"
curl -s http://localhost:2000/api/v2/runtimes | jq -r "length as $count | "Available runtimes: \($count)"" 2>/dev/null || echo "❌ API not responding"

echo "👷 Worker Process:"
sudo -u ubuntu pm2 list | grep codecapsule-worker

echo "💾 Disk Usage:"
df -h / | tail -1

echo "🧠 Memory Usage:"
free -h
echo "=========================="
EOF

chmod +x /home/ubuntu/health-check.sh
chown ubuntu:ubuntu /home/ubuntu/health-check.sh

# Final status check
log "Running final health checks..."
sleep 5

# Check if everything is running
log "📦 Installing CodeCapsule Queue Worker..."

# Create queue worker directory
WORKER_DIR="/opt/codecapsule-worker"
mkdir -p $WORKER_DIR
cd $WORKER_DIR

# Create package.json
cat > package.json << 'WORKER_PACKAGE_EOF'
{
  "name": "codecapsule-queue-worker",
  "version": "1.0.0",
  "description": "CodeCapsule Queue Worker for Piston Execution",
  "main": "queue-worker.js",
  "scripts": {
    "start": "node queue-worker.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.38.5",
    "@upstash/redis": "^1.25.1",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.1"
  }
}
WORKER_PACKAGE_EOF

# Install dependencies
npm install

# Create services directory
mkdir -p services

# Create ExecutionQueue service
cat > services/queue.js << 'QUEUE_SERVICE_EOF'
const { Redis } = require('@upstash/redis');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class ExecutionQueue {
  constructor() {
    this.queueName = 'execution_queue';
  }

  async queueJob(language, code, input = '', options = {}) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      language,
      code,
      input,
      options,
      timestamp: new Date().toISOString(),
      status: 'queued'
    };

    try {
      await redis.lpush(this.queueName, JSON.stringify(job));
      console.log(`✅ Job queued: ${jobId} (${language})`);
      return jobId;
    } catch (error) {
      console.error('❌ Failed to queue job:', error);
      throw new Error('Failed to queue execution job');
    }
  }

  async setJobStatus(jobId, status, result = {}) {
    try {
      const statusData = {
        jobId,
        status,
        result,
        timestamp: new Date().toISOString()
      };

      await redis.setex(`job_status:${jobId}`, 3600, JSON.stringify(statusData));
      await supabase.channel(`job-${jobId}`).send({
        type: 'broadcast',
        event: 'job_update',
        payload: statusData
      });
    } catch (error) {
      console.error('❌ Failed to set job status:', error);
    }
  }

  async processQueue(processorFunction) {
    console.log('🔄 Queue processor started...');
    
    while (true) {
      try {
        const result = await redis.brpop(this.queueName, 0);
        
        if (!result || !result[1]) {
          continue;
        }

        const job = JSON.parse(result[1]);
        console.log(`📋 Processing job: ${job.id} (${job.language})`);

        await this.setJobStatus(job.id, 'processing');

        try {
          const executionResult = await processorFunction(job);
          await this.setJobStatus(job.id, 'completed', executionResult);
          console.log(`✅ Job completed: ${job.id}`);
        } catch (processingError) {
          console.error(`❌ Job failed: ${job.id}`, processingError);
          await this.setJobStatus(job.id, 'failed', {
            error: processingError.message,
            stdout: '',
            stderr: processingError.message
          });
        }
      } catch (error) {
        console.error('❌ Queue processing error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

module.exports = ExecutionQueue;
QUEUE_SERVICE_EOF

# Create PistonClient service
cat > services/piston-client.js << 'PISTON_CLIENT_EOF'
const axios = require('axios');

class PistonClient {
  constructor(pistonUrl = 'http://localhost:2000') {
    this.baseURL = pistonUrl;
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.LANGUAGE_VERSIONS = {
      python: '3.10.0',
      javascript: '18.15.0',
      typescript: '5.0.3',
      go: '1.16.2',
      java: '15.0.2',
      cpp: '10.2.0',
      c: '10.2.0',
      csharp: '6.12.0',
      php: '8.2.3',
      ruby: '3.0.1',
      rust: '1.68.2',
      sql: '3.36.0'
    };
  }

  async executeCode(language, code, input = '', options = {}) {
    try {
      const version = this.LANGUAGE_VERSIONS[language] || this.LANGUAGE_VERSIONS.python;
      const fileName = this.getFileName(language);
      
      const payload = {
        language,
        version,
        files: [{ name: fileName, content: code }],
        stdin: input,
        compile_timeout: options.compileTimeout || 10000,
        run_timeout: options.timeout || 30000
      };

      const response = await this.api.post('/api/v2/execute', payload);
      const result = response.data;
      
      return {
        success: result.run?.code === 0,
        stdout: result.run?.stdout || '',
        stderr: result.run?.stderr || '',
        exitCode: result.run?.code || 0,
        language
      };
    } catch (error) {
      return {
        success: false,
        stdout: '',
        stderr: error.message,
        exitCode: 1,
        language,
        error: error.message
      };
    }
  }

  getFileName(language) {
    const extensions = {
      python: 'main.py',
      javascript: 'main.js',
      typescript: 'main.ts',
      java: 'Main.java',
      cpp: 'main.cpp',
      c: 'main.c',
      csharp: 'main.cs',
      go: 'main.go',
      php: 'main.php',
      ruby: 'main.rb',
      rust: 'main.rs',
      sql: 'main.sql'
    };
    return extensions[language] || 'main.txt';
  }

  async healthCheck() {
    try {
      const response = await this.api.get('/api/v2/runtimes');
      return {
        status: 'healthy',
        runtimesCount: response.data.length
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = PistonClient;
PISTON_CLIENT_EOF

# Create main queue worker
cat > queue-worker.js << 'QUEUE_WORKER_EOF'
const ExecutionQueue = require('./services/queue');
const PistonClient = require('./services/piston-client');
require('dotenv').config();

class QueueWorker {
  constructor() {
    this.queue = new ExecutionQueue();
    this.pistonClient = new PistonClient(process.env.PISTON_URL || 'http://localhost:2000');
  }

  async start() {
    console.log('🚀 CodeCapsule Queue Worker starting...');
    console.log(`📡 Redis: ${process.env.UPSTASH_REDIS_URL ? 'Configured' : 'Not configured'}`);
    console.log(`🗄️  Supabase: ${process.env.SUPABASE_URL ? 'Configured' : 'Not configured'}`);

    try {
      const health = await this.pistonClient.healthCheck();
      if (health.status !== 'healthy') {
        throw new Error(`Piston health check failed: ${health.error}`);
      }
      
      console.log(`✅ Piston ready with ${health.runtimesCount} runtimes`);
      await this.queue.processQueue(this.executeJob.bind(this));
      
    } catch (error) {
      console.error('❌ Worker startup failed:', error.message);
      process.exit(1);
    }
  }

  async executeJob(job) {
    const { language, code, input, options } = job;
    
    try {
      return await this.pistonClient.executeCode(language, code, input, options);
    } catch (error) {
      return {
        success: false,
        stdout: '',
        stderr: error.message,
        exitCode: 1,
        language,
        error: error.message
      };
    }
  }
}

if (require.main === module) {
  const worker = new QueueWorker();
  
  process.on('SIGINT', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
  
  worker.start().catch(error => {
    console.error('❌ Worker failed:', error);
    process.exit(1);
  });
}

module.exports = QueueWorker;
QUEUE_WORKER_EOF

# Create environment file template
cat > .env << 'ENV_EOF'
# Redis Configuration (Upstash) - UPDATE WITH REAL VALUES
UPSTASH_REDIS_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_TOKEN=your-redis-token

# Supabase Configuration - UPDATE IF NEEDED
SUPABASE_URL=https://dinerkhhhoibcrznysen.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpbmVya2hoaG9pYmNyem55c2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzODE3NSwiaWF0IjoyMDc2NzE0MTc1fQ.WNEVUApyZZa7LHOTUgCVUta6rTc7v1wVAynbxA02tsQ

# Piston Configuration
PISTON_URL=http://localhost:2000

NODE_ENV=production
ENV_EOF

# Set proper ownership
chown -R ubuntu:ubuntu $WORKER_DIR

# Create systemd service
cat > /etc/systemd/system/codecapsule-worker.service << 'SYSTEMD_EOF'
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
SYSTEMD_EOF

# Enable the service
systemctl daemon-reload
systemctl enable codecapsule-worker

log "✅ Queue Worker installed and configured"
log "📝 Update /opt/codecapsule-worker/.env with Redis credentials"
log "🚀 Start with: systemctl start codecapsule-worker"

if docker ps | grep -q piston; then
    log "✅ Setup completed successfully!"
    log "🐳 Piston container is running"
    log "👷 Queue Worker ready to start"
    log "🔍 Health check script available at /home/ubuntu/health-check.sh"
else
    log "❌ Setup completed with warnings - check individual components"
fi

log "Setup script finished at $(date)"
