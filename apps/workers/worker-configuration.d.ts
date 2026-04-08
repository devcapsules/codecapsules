/**
 * Cloudflare Worker Environment Bindings
 * Auto-generated types for TypeScript
 */

interface Env {
  // ── KV Namespaces ──
  CACHE: KVNamespace;       // Published capsules cache
  SESSIONS: KVNamespace;    // User sessions
  JOB_PROGRESS: KVNamespace;// Async job progress tracking
  RATE_LIMITS: KVNamespace; // Daily quota counters (write only on success)

  // ── Native Rate Limiters (atomic, per-PoP, per-minute abuse prevention) ──
  RATE_LIMITER_FREE: RateLimit;     // 10 req/60s
  RATE_LIMITER_CREATOR: RateLimit;  // 60 req/60s
  RATE_LIMITER_TEAM: RateLimit;     // 300 req/60s

  // ── D1 Database ──
  DB: D1Database;

  // ── Queues ──
  GENERATION_QUEUE: Queue<GenerationJob>;
  EXECUTION_QUEUE: Queue<ExecutionJob>;

  // ── Durable Objects ──
  CONCURRENCY_CONTROLLER: DurableObjectNamespace;
  SQL_SANDBOX: DurableObjectNamespace;

  // ── R2 Storage ──
  ASSETS: R2Bucket;
  CDN: R2Bucket;  // cdn.devcapsules.com bucket

  // ── Environment Variables ──
  ENVIRONMENT: 'development' | 'staging' | 'production';
  API_VERSION: string;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  CORS_ORIGINS: string;
  AZURE_OPENAI_ENDPOINT: string;
  AZURE_OPENAI_DEPLOYMENT: string;
  AZURE_OPENAI_API_VERSION: string;

  // ── Azure Tunnel — Cloudflare Tunnel → Azure VMSS ──
  // Tunnel URL for AI generation pipeline (3-agent pipeline on Azure VMs)
  TUNNEL_URL: string;
  // Piston code execution URL (routed through Cloudflare Tunnel)
  PISTON_URL: string;

  // ── Secrets ──
  AZURE_OPENAI_API_KEY: string;
  JWT_SECRET: string;
  // Supabase JWT secret for verifying dashboard auth tokens
  SUPABASE_JWT_SECRET: string;
  // HMAC shared secret for Workers ↔ Azure VM authentication
  WORKER_SHARED_SECRET: string;

  // ── Razorpay ──
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;
}

// ── Queue Job Types ──
interface GenerationJob {
  jobId: string;
  userId: string;
  prompt: string;
  language: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  type?: string; // Capsule type (code, database, quiz, etc.)
  timestamp: number;
}

interface ExecutionJob {
  jobId: string;
  type: 'run' | 'tests';
  language: string;
  sourceCode: string;
  input: string;
  timeLimit: number;
  memoryLimit: number;
  // Only for type === 'tests'
  userCode?: string;
  functionName?: string;
  testCases?: Array<{ input_args: unknown[]; expected_output: unknown; description?: string; type?: string }>;
  // Metadata
  userId?: string;
  orgId?: string;   // Per-org DO sharding key (B2B org or userId fallback)
  plan?: string;    // User plan for per-org slot limits
  quotaKey?: string;
  requestId: string;
  timestamp: number;
}

interface ExecutionJobResult {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  type: 'run' | 'tests';
  // For type === 'run'
  result?: {
    success: boolean;
    stdout: string;
    stderr: string;
    exit_code: number;
    execution_time: number;
    tier: 'edge' | 'piston';
  };
  // For type === 'tests'
  testResult?: {
    success: boolean;
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      successRate: number;
      allPassed: boolean;
      totalTime: number;
    };
    results: Array<{
      testCase: number;
      description: string;
      type: string;
      passed: boolean;
      output: unknown;
      expected: unknown;
      executionTime: number;
      error?: string;
    }>;
  };
  error?: string;
  createdAt: number;
  completedAt?: number;
}

// ── Auth Types ──
interface Auth {
  userId: string;
  email: string;
  plan: 'free' | 'creator' | 'team' | 'enterprise';
  isApiKey: boolean;
}

// ── API Response Types ──
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    requestId: string;
    timestamp: number;
    version: string;
  };
}
