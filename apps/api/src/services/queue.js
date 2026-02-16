require('dotenv').config();
const { Redis } = require('@upstash/redis');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Simple UUID v4 generator to avoid ESM issues with uuid package
function uuidv4() {
  return crypto.randomUUID();
}

// Redis configuration (Upstash) - with fallback for missing config
let redis = null;
try {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
    console.log('✅ Redis configured');
  } else {
    console.warn('⚠️ Redis not configured - queue system disabled');
  }
} catch (err) {
  console.error('❌ Redis initialization error:', err.message);
}

// Supabase configuration for real-time updates - with fallback
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    console.log('✅ Supabase configured');
  } else {
    console.warn('⚠️ Supabase not configured - real-time updates disabled');
  }
} catch (err) {
  console.error('❌ Supabase initialization error:', err.message);
}

class ExecutionQueue {
  constructor() {
    this.queueName = 'execution_queue';
  }

  /**
   * Queue a code execution job
   * @param {string} language - Programming language
   * @param {string} code - Code to execute
   * @param {string} input - Optional input for the code
   * @param {object} options - Additional execution options
   * @returns {Promise<string>} Job ID
   */
  async queueJob(language, code, input = '', options = {}) {
    if (!redis) {
      throw new Error('Queue system not configured - Redis is not available');
    }

    const jobId = uuidv4();
    const job = {
      jobId,  // EC2 worker expects 'jobId' field
      id: jobId,
      language,
      code,
      input,
      options,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      status: 'queued'
    };

    try {
      // Add job to Redis queue (rpush to match EC2 worker's lpop)
      await redis.rpush(this.queueName, JSON.stringify(job));
      
      // Initialize job status
      await redis.hset(`job:${jobId}`, { status: 'queued', createdAt: job.createdAt });
      
      console.log(`✅ Job queued: ${jobId} (${language})`);
      return jobId;
    } catch (error) {
      console.error('❌ Failed to queue job:', error);
      throw new Error('Failed to queue execution job');
    }
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID
   * @returns {Promise<object|null>} Job status
   */
  async getJobStatus(jobId) {
    if (!redis) {
      return null;
    }

    try {
      // Get status from Redis hash (matches EC2 worker format)
      const statusData = await redis.hgetall(`job:${jobId}`);
      
      if (!statusData || Object.keys(statusData).length === 0) {
        return null;
      }

      // Parse result if it exists
      let result = null;
      if (statusData.result) {
        try {
          result = typeof statusData.result === 'string' 
            ? JSON.parse(statusData.result) 
            : statusData.result;
        } catch (e) {
          result = statusData.result;
        }
      }

      return {
        jobId,
        status: statusData.status || 'unknown',
        createdAt: statusData.createdAt,
        startedAt: statusData.startedAt,
        completedAt: statusData.completedAt,
        result
      };
    } catch (error) {
      console.error('❌ Failed to get job status:', error);
      return null;
    }
  }

  /**
   * Set job status
   * @param {string} jobId - Job ID
   * @param {string} status - Status (queued, processing, completed, failed)
   * @param {object} result - Execution result
   */
  async setJobStatus(jobId, status, result = {}) {
    try {
      const statusData = {
        jobId,
        status,
        result,
        timestamp: new Date().toISOString()
      };

      // Store status in Redis with 1 hour TTL
      await redis.setex(`job_status:${jobId}`, 3600, JSON.stringify(statusData));

      // Broadcast status via Supabase for real-time updates
      await this.broadcastJobUpdate(jobId, statusData);
    } catch (error) {
      console.error('❌ Failed to set job status:', error);
    }
  }

  /**
   * Broadcast job update via Supabase real-time
   * @param {string} jobId - Job ID
   * @param {object} statusData - Status data to broadcast
   */
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

  /**
   * Process queue (used by worker)
   * @param {function} processorFunction - Function to process jobs
   */
  async processQueue(processorFunction) {
    console.log('🔄 Queue processor started...');
    
    while (true) {
      try {
        // Block and wait for job from queue
        const result = await redis.brpop(this.queueName, 0);
        
        if (!result || !result[1]) {
          continue;
        }

        const job = JSON.parse(result[1]);
        console.log(`📋 Processing job: ${job.id} (${job.language})`);

        // Update status to processing
        await this.setJobStatus(job.id, 'processing');

        try {
          // Process the job
          const executionResult = await processorFunction(job);
          
          // Update status to completed
          await this.setJobStatus(job.id, 'completed', executionResult);
          
          console.log(`✅ Job completed: ${job.id}`);
        } catch (processingError) {
          console.error(`❌ Job failed: ${job.id}`, processingError);
          
          // Update status to failed
          await this.setJobStatus(job.id, 'failed', {
            error: processingError.message,
            stdout: '',
            stderr: processingError.message
          });
        }
      } catch (error) {
        console.error('❌ Queue processing error:', error);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Execute code synchronously (queue + poll for result)
   * Used by generation pipeline for test validation
   * @param {string} language - Programming language
   * @param {string} code - Code to execute
   * @param {string} input - Optional input
   * @param {number} timeout - Timeout in seconds (default 30)
   * @returns {Promise<object>} Execution result
   */
  async executeSync(language, code, input = '', timeout = 30) {
    if (!redis) {
      throw new Error('Queue system not configured - Redis is not available');
    }

    try {
      // Queue the job
      const jobId = await this.queueJob(language, code, input);
      console.log(`⏳ Waiting for job ${jobId} to complete (timeout: ${timeout}s)...`);

      // Poll for result with exponential backoff
      const startTime = Date.now();
      let pollInterval = 1000; // Start with 1 second between polls
      const maxWait = timeout * 1000;
      const maxPollInterval = 5000; // Max 5 seconds between polls

      while (Date.now() - startTime < maxWait) {
        const status = await this.getJobStatus(jobId);
        
        // Reduced debug logging to save Redis requests
        if (Date.now() - startTime > 10000) { // Only log after 10 seconds
          console.log(`🔍 Poll ${jobId}: status=${status?.status}, elapsed=${Math.round((Date.now() - startTime)/1000)}s`);
        }
        
        // Check for completion by completedAt field (more reliable than status due to Upstash hset quirk)
        if (status && status.completedAt && status.result) {
          const isSuccess = status.result?.success !== false;
          console.log(`✅ Job ${jobId} completed in ${Date.now() - startTime}ms`);
          return {
            success: isSuccess,
            stdout: status.result?.stdout || '',
            stderr: status.result?.stderr || '',
            exit_code: status.result?.exitCode ?? 0,
            execution_time: status.result?.executionTime || Date.now() - startTime
          };
        }
        
        if (status && status.status === 'failed') {
          console.log(`❌ Job ${jobId} failed: ${status.result?.error}`);
          return {
            success: false,
            stdout: '',
            stderr: status.result?.error || 'Execution failed',
            exit_code: 1,
            error: status.result?.error || 'Execution failed'
          };
        }

        // Wait with exponential backoff to reduce Redis load
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        pollInterval = Math.min(pollInterval * 1.5, maxPollInterval); // Exponential backoff
      }

      // Timeout
      console.log(`⏰ Job ${jobId} timed out after ${timeout}s`);
      return {
        success: false,
        stdout: '',
        stderr: `Execution timed out after ${timeout} seconds`,
        exit_code: 124, // Standard timeout exit code
        error: 'Execution timeout'
      };

    } catch (error) {
      console.error('❌ Sync execution failed:', error);
      return {
        success: false,
        stdout: '',
        stderr: error.message,
        exit_code: 1,
        error: error.message
      };
    }
  }

  /**
   * Get queue length
   * @returns {Promise<number>} Number of jobs in queue
   */
  async getQueueLength() {
    try {
      return await redis.llen(this.queueName);
    } catch (error) {
      console.error('❌ Failed to get queue length:', error);
      return 0;
    }
  }

  /**
   * Clear the queue (for testing/maintenance)
   */
  async clearQueue() {
    try {
      await redis.del(this.queueName);
      console.log('🗑️ Queue cleared');
    } catch (error) {
      console.error('❌ Failed to clear queue:', error);
    }
  }
}

module.exports = ExecutionQueue;