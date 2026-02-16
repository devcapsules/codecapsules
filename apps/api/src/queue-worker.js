const ExecutionQueue = require('./services/queue');
const PistonClient = require('./services/piston-client');
require('dotenv').config();

class QueueWorker {
  constructor() {
    this.queue = new ExecutionQueue();
    this.pistonClient = new PistonClient(process.env.PISTON_URL || 'http://localhost:2000');
    this.isRunning = false;
  }

  /**
   * Start the queue worker
   */
  async start() {
    console.log('🚀 CodeCapsule Queue Worker starting...');
    console.log(`📡 Redis: ${process.env.UPSTASH_REDIS_URL ? 'Configured' : 'Not configured'}`);
    console.log(`🗄️  Supabase: ${process.env.SUPABASE_URL ? 'Configured' : 'Not configured'}`);
    console.log(`⚡ Piston: ${process.env.PISTON_URL || 'http://localhost:2000'}`);

    try {
      // Ensure Piston runtimes are installed
      await this.pistonClient.ensureRuntimesInstalled();
      
      // Health check
      const health = await this.pistonClient.healthCheck();
      if (health.status !== 'healthy') {
        throw new Error(`Piston health check failed: ${health.error}`);
      }
      
      console.log(`✅ Piston ready with ${health.runtimesCount} runtimes`);
      
      // Start processing queue
      this.isRunning = true;
      console.log('📋 Queue processing started...');
      
      await this.queue.processQueue(this.executeJob.bind(this));
      
    } catch (error) {
      console.error('❌ Worker startup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Execute a job from the queue
   * @param {object} job - Job to execute
   * @returns {Promise<object>} Execution result
   */
  async executeJob(job) {
    const { id, language, code, input, options } = job;
    
    console.log(`🔄 Executing job ${id}: ${language}`);
    
    try {
      // Validate job data
      if (!language || !code) {
        throw new Error('Invalid job: missing language or code');
      }

      // Execute code using Piston
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

  /**
   * Stop the worker gracefully
   */
  async stop() {
    console.log('⏹️ Stopping queue worker...');
    this.isRunning = false;
    // Add any cleanup logic here
  }

  /**
   * Get worker stats
   */
  async getStats() {
    const queueLength = await this.queue.getQueueLength();
    const pistonHealth = await this.pistonClient.healthCheck();
    
    return {
      worker: {
        status: this.isRunning ? 'running' : 'stopped',
        timestamp: new Date().toISOString()
      },
      queue: {
        length: queueLength
      },
      piston: pistonHealth
    };
  }
}

// Handle graceful shutdown
function setupGracefulShutdown(worker) {
  const shutdown = async (signal) => {
    console.log(`📡 Received ${signal}, shutting down gracefully...`);
    await worker.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Start worker if run directly
if (require.main === module) {
  const worker = new QueueWorker();
  setupGracefulShutdown(worker);
  
  worker.start().catch(error => {
    console.error('❌ Worker failed:', error);
    process.exit(1);
  });
}

module.exports = QueueWorker;