const express = require('express');
const ExecutionQueue = require('../services/queue');
const router = express.Router();

const queue = new ExecutionQueue();

// Supported languages mapping to ensure consistency
const SUPPORTED_LANGUAGES = {
  'python': 'python',
  'javascript': 'javascript', 
  'java': 'java',
  'cpp': 'cpp',
  'c': 'c',
  'csharp': 'csharp',
  'go': 'go',
  'php': 'php',
  'ruby': 'ruby',
  'rust': 'rust',
  'sql': 'sql'
};

/**
 * Queue code execution (async)
 * POST /api/v2/execute/:language
 */
router.post('/execute/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const { code, input = '', timeout = 30000 } = req.body;

    // Validate language
    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language: ${language}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`
      });
    }

    // Validate code
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Code is required and must be a string'
      });
    }

    // Queue the job
    const jobId = await queue.queueJob(language, code, input, { timeout });

    // Return job ID immediately for async processing
    res.status(202).json({
      success: true,
      jobId,
      status: 'queued',
      message: 'Code execution queued successfully',
      statusUrl: `/api/v2/status/${jobId}`,
      websocketChannel: `job-${jobId}`
    });

  } catch (error) {
    console.error('❌ Execute endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Get job status and results
 * GET /api/v2/status/:jobId
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    const status = await queue.getJobStatus(jobId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or expired'
      });
    }

    res.json({
      success: true,
      ...status
    });

  } catch (error) {
    console.error('❌ Status endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Get queue statistics
 * GET /api/v2/queue/stats
 */
router.get('/queue/stats', async (req, res) => {
  try {
    const queueLength = await queue.getQueueLength();
    
    res.json({
      success: true,
      stats: {
        queueLength,
        supportedLanguages: Object.keys(SUPPORTED_LANGUAGES),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Queue stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue statistics'
    });
  }
});

/**
 * Health check for queue service
 * GET /api/v2/queue/health
 */
router.get('/queue/health', async (req, res) => {
  try {
    // Test Redis connection
    const pingResult = await queue.redis?.ping?.() || 'PONG';
    const queueLength = await queue.getQueueLength();
    
    res.json({
      success: true,
      health: {
        redis: pingResult === 'PONG' ? 'connected' : 'disconnected',
        queue: {
          length: queueLength,
          status: 'operational'
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Queue health check error:', error);
    res.status(503).json({
      success: false,
      health: {
        redis: 'disconnected',
        queue: { status: 'error' },
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;