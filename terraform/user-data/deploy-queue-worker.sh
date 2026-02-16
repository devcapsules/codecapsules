# CodeCapsule Queue Worker Deployment Script
#!/bin/bash

# This script deploys the queue worker to the Piston EC2 instance

set -e

log() {
    echo "$(date "+%Y-%m-%d %H:%M:%S") - $1" | tee -a /var/log/codecapsule-deploy.log
}

log "🚀 Starting CodeCapsule Queue Worker deployment..."

# Create working directory
WORK_DIR="/opt/codecapsule-worker"
mkdir -p $WORK_DIR
cd $WORK_DIR

# Create package.json for the worker
cat > package.json << "EOF"
{
  "name": "codecapsule-queue-worker",
  "version": "1.0.0",
  "description": "CodeCapsule Queue Worker for Piston Execution",
  "main": "queue-worker.js",
  "scripts": {
    "start": "node queue-worker.js",
    "dev": "node queue-worker.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.38.5",
    "@upstash/redis": "^1.25.1",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Install dependencies
log "📦 Installing Node.js dependencies..."
npm install

# Create services directory
mkdir -p services

# Create the ExecutionQueue service
cat > services/queue.js << "EOF"
const { Redis } = require('@upstash/redis');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Redis configuration (Upstash)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// Supabase configuration for real-time updates
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

  async getJobStatus(jobId) {
    try {
      const status = await redis.get(`job_status:${jobId}`);
      return status ? JSON.parse(status) : null;
    } catch (error) {
      console.error('❌ Failed to get job status:', error);
      return null;
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
      await this.broadcastJobUpdate(jobId, statusData);
    } catch (error) {
      console.error('❌ Failed to set job status:', error);
    }
  }

  async broadcastJobUpdate(jobId, statusData) {
    try {
      await supabase.channel(`job-${jobId}`).send({
        type: 'broadcast',
        event: 'job_update',
        payload: statusData
      });
    } catch (error) {
      console.error('❌ Failed to broadcast job update:', error);
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

  async getQueueLength() {
    try {
      return await redis.llen(this.queueName);
    } catch (error) {
      console.error('❌ Failed to get queue length:', error);
      return 0;
    }
  }
}

module.exports = ExecutionQueue;
EOF

# Create the Piston client
cat > services/piston-client.js << "EOF"
const axios = require('axios');

class PistonClient {
  constructor(pistonUrl = 'http://localhost:2000') {
    this.baseURL = pistonUrl;
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
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
        files: [{
          name: fileName,
          content: code
        }],
        stdin: input,
        compile_timeout: options.compileTimeout || 10000,
        run_timeout: options.timeout || 30000,
        compile_memory_limit: options.compileMemoryLimit || 128000000,
        run_memory_limit: options.runMemoryLimit || 128000000
      };

      console.log(`🚀 Executing ${language} code via Piston...`);
      const startTime = Date.now();
      
      const response = await this.api.post('/api/v2/execute', payload);
      const executionTime = Date.now() - startTime;
      
      const result = response.data;
      
      return {
        success: result.run?.code === 0,
        stdout: result.run?.stdout || result.run?.output || '',
        stderr: result.run?.stderr || '',
        exitCode: result.run?.code || 0,
        executionTime,
        language,
        memoryUsed: result.run?.memory || 0,
        signal: result.run?.signal || null
      };

    } catch (error) {
      console.error(`❌ Piston execution error (${language}):`, error.message);
      
      return {
        success: false,
        stdout: '',
        stderr: error.message,
        exitCode: 1,
        executionTime: 0,
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
      const runtimes = response.data;
      return {
        status: 'healthy',
        runtimesCount: runtimes.length,
        availableLanguages: runtimes.map(r => r.language),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = PistonClient;
EOF

# Create the main queue worker
cat > queue-worker.js << "EOF"
const ExecutionQueue = require('./services/queue');
const PistonClient = require('./services/piston-client');
require('dotenv').config();

class QueueWorker {
  constructor() {
    this.queue = new ExecutionQueue();
    this.pistonClient = new PistonClient(process.env.PISTON_URL || 'http://localhost:2000');
    this.isRunning = false;
  }

  async start() {
    console.log('🚀 CodeCapsule Queue Worker starting...');
    console.log(`📡 Redis: ${process.env.UPSTASH_REDIS_URL ? 'Configured' : 'Not configured'}`);
    console.log(`🗄️  Supabase: ${process.env.SUPABASE_URL ? 'Configured' : 'Not configured'}`);
    console.log(`⚡ Piston: ${process.env.PISTON_URL || 'http://localhost:2000'}`);

    try {
      const health = await this.pistonClient.healthCheck();
      if (health.status !== 'healthy') {
        throw new Error(`Piston health check failed: ${health.error}`);
      }
      
      console.log(`✅ Piston ready with ${health.runtimesCount} runtimes`);
      
      this.isRunning = true;
      console.log('📋 Queue processing started...');
      
      await this.queue.processQueue(this.executeJob.bind(this));
      
    } catch (error) {
      console.error('❌ Worker startup failed:', error.message);
      process.exit(1);
    }
  }

  async executeJob(job) {
    const { id, language, code, input, options } = job;
    
    console.log(`🔄 Executing job ${id}: ${language}`);
    
    try {
      if (!language || !code) {
        throw new Error('Invalid job: missing language or code');
      }

      const result = await this.pistonClient.executeCode(
        language, 
        code, 
        input, 
        options
      );
      
      console.log(`✅ Job ${id} completed: ${result.success ? 'success' : 'failed'}`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Job ${id} execution error:`, error.message);
      
      return {
        success: false,
        stdout: '',
        stderr: error.message,
        exitCode: 1,
        executionTime: 0,
        language,
        error: error.message
      };
    }
  }

  async stop() {
    console.log('⏹️ Stopping queue worker...');
    this.isRunning = false;
  }
}

function setupGracefulShutdown(worker) {
  const shutdown = async (signal) => {
    console.log(`📡 Received ${signal}, shutting down gracefully...`);
    await worker.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

if (require.main === module) {
  const worker = new QueueWorker();
  setupGracefulShutdown(worker);
  
  worker.start().catch(error => {
    console.error('❌ Worker failed:', error);
    process.exit(1);
  });
}

module.exports = QueueWorker;
EOF

# Create environment file with placeholder values
cat > .env << "EOF"
# Redis Configuration (Upstash) - UPDATE THESE VALUES
UPSTASH_REDIS_URL=your-upstash-redis-url-here
UPSTASH_REDIS_TOKEN=your-upstash-redis-token-here

# Supabase Configuration - UPDATE THESE VALUES  
SUPABASE_URL=https://dinerkhhhoibcrznysen.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpbmVya2hoaG9pYmNyem55c2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzODE3NSwiaWF0IjoyMDc2NzE0MTc1fQ.WNEVUApyZZa7LHOTUgCVUta6rTc7v1wVAynbxA02tsQ

# Piston Configuration (localhost on EC2)
PISTON_URL=http://localhost:2000

# Worker Configuration
NODE_ENV=production
EOF

# Set proper ownership and permissions
chown -R ubuntu:ubuntu $WORK_DIR
chmod +x $WORK_DIR/queue-worker.js

# Create systemd service for the worker
cat > /etc/systemd/system/codecapsule-worker.service << "EOF"
[Unit]
Description=CodeCapsule Queue Worker
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/codecapsule-worker
ExecStart=/usr/bin/node queue-worker.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/codecapsule-worker/.env

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=codecapsule-worker

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable the service
systemctl daemon-reload
systemctl enable codecapsule-worker

log "✅ Queue worker deployed successfully!"
log "📝 Next steps:"
log "   1. Update .env with real Redis and Supabase credentials"
log "   2. Start the service: systemctl start codecapsule-worker" 
log "   3. Check status: systemctl status codecapsule-worker"
log "   4. View logs: journalctl -u codecapsule-worker -f"

echo "🎉 CodeCapsule Queue Worker deployment complete!"