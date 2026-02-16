/**
 * Bridge API Configuration
 *
 * All config from environment variables with sensible defaults.
 * Loaded once at startup via dotenv.
 */
import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // ── HMAC auth for Cloudflare Worker requests ──
  workerSharedSecret: process.env.WORKER_SHARED_SECRET || 'dev-secret-change-me',

  // ── Piston code execution engine (Docker internal DNS) ──
  pistonUrl: process.env.PISTON_URL || 'http://piston:2000',

  // ── Azure OpenAI (used by the 3-agent generation pipeline) ──
  azureOpenAI: {
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview',
  },

  // ── Allowed Worker callers for HMAC auth ──
  allowedCallers: [
    'generation-consumer',
    'mentor-worker',
    'test-executor',
    'execute-worker',
    'analytics-worker',
  ],
};
