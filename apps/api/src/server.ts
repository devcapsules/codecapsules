import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
// Force deployment: v20251207
import dotenv from 'dotenv'
import path from 'path'
import { createServer } from 'http'
import WebSocket, { WebSocketServer } from 'ws'
import { 
  createGenerationEngine,
  type GenerationConfig,
  type GenerationResult
} from '../../../packages/core/src/generators/generation-engine'
import { 
  ServerlessExecutionEngine,
  type SupportedLanguage,
  type ExecutionResult 
} from '../../../packages/runtime/serverless-execution'
import { 
  capsuleQueries,
  userQueries 
} from '../../../packages/database/src/queries'
import {
  createPlaylist,
  getPlaylistWithCapsules,
  updatePlaylist,
  getPlaylistsByCreator
} from '../../../packages/database/src/basecapsule-queries'
import {
  EventTracker,
  AnalyticsCollector,
  QualityMetrics,
  FeedbackProcessor,
  FeedbackFlywheel,
  AIMentor
} from '../../../packages/core/src/analytics'
import { GenerationPipeline, GenerationContext, PipelineGenerationResult } from '../../../packages/core/src/agents/generation-pipeline'
import { BaseCapsule } from '../../../packages/core/src/types/base-capsule'
import { GenerationResult as OldGenerationResult, GenerationMetadata } from '../../../packages/core/src/generators/generation-engine'
import { AIService } from '../../../packages/core/src/services/ai-service'
import { handleMentorHintRequest } from '../../../packages/core/src/api/mentor-endpoint'

// Import queue service for Phase 2 execution
const ExecutionQueue = require('./services/queue')
const executionQueue = new ExecutionQueue()

// Import R2 storage service for Phase 2 CDN
import { createR2Service } from './services/r2-storage'
const r2Storage = createR2Service()

// Load environment variables from the API package directory
const envPath = path.join(__dirname, '../.env')
dotenv.config({ path: envPath })

// Check if queue-based execution is enabled
const USE_QUEUE_EXECUTION = process.env.USE_QUEUE_EXECUTION === 'true'

console.log('🔧 Environment check:')
console.log('   AZURE_OPENAI_API_KEY:', process.env.AZURE_OPENAI_API_KEY ? '✅ Set' : '❌ Missing')
console.log('   AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT ? '✅ Set' : '❌ Missing')
console.log('   AWS_LAMBDA_URL:', process.env.AWS_LAMBDA_URL ? '✅ AWS Lambda (Production)' : '⚠️  Local Development')
console.log('   USE_QUEUE_EXECUTION:', USE_QUEUE_EXECUTION ? '✅ EC2 Piston Queue' : '⚠️  Lambda Execution')
console.log('   R2_STORAGE:', r2Storage ? '✅ Cloudflare R2 CDN' : '⚠️  No CDN (DB only)')

const app = express()
const PORT = process.env.PORT || 3001

// Check if running via Lambda Function URL (not API Gateway)
const isLambdaFunctionUrl = process.env.AWS_LAMBDA_FUNCTION_URL === 'true'

// Configure CORS with explicit origins for production - MUST be before other middleware
// Skip if Lambda Function URL handles CORS at infrastructure level
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://devcapsules.com',
      'https://www.devcapsules.com',
      'https://codecapsule-dashboard.pages.dev',
      'https://codecapsule-embed.pages.dev'
    ]
    
    // Check exact match or regex patterns for Cloudflare preview deployments
    if (allowedOrigins.includes(origin) || 
        /\.codecapsule-dashboard\.pages\.dev$/.test(origin) ||
        /\.codecapsule-embed\.pages\.dev$/.test(origin)) {
      callback(null, true)
    } else {
      // Log but allow for debugging - in production you might want to reject
      console.log(`⚠️ CORS: Allowing origin: ${origin}`)
      callback(null, true)
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
}

// Only use Express CORS if NOT using Lambda Function URL
// Lambda Function URL adds its own CORS headers which would conflict
if (!isLambdaFunctionUrl) {
  app.use(cors(corsOptions))
} else {
  console.log('⚡ Lambda Function URL detected - skipping Express CORS (handled at infrastructure level)')
}

// Helmet with CORS-friendly settings
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' }
}))

app.use(express.json())

// ══════════════════════════════════════════════════════════════════════════
// HYBRID BRIDGE: Worker Authentication + Internal Routes
// These enable Cloudflare Workers to securely call Lambda for AI operations
// ══════════════════════════════════════════════════════════════════════════
import { workerAuthMiddleware, getWorkerAuthConfig } from './middleware/worker-auth'
import internalRoutes from './routes/internal'

// Worker authentication middleware (must be before routes)
// - /health: Always public (for load balancer)
// - /internal/*: Requires signed Worker requests
// - /api/*: Blocked in production (users must go through Workers)
app.use(workerAuthMiddleware(getWorkerAuthConfig()))

// Internal routes for Workers → Lambda communication
app.use(internalRoutes)

console.log('🔐 Hybrid Bridge: Worker auth middleware enabled')
console.log('🌉 Hybrid Bridge: Internal routes mounted at /internal/*')

// Import analytics routes
import analyticsRoutes from './routes/analytics'
app.use('/api/analytics', analyticsRoutes)

// Import and mount queue-based execution routes (v2 API)
const queueExecuteRoutes = require('./routes/queue-execute')
app.use('/api/v2', queueExecuteRoutes)

// Initialize unified AI generation engine
const generationEngine = createGenerationEngine()

// Initialize serverless execution engine with production configuration
const executionEngine = new ServerlessExecutionEngine(
  process.env.AWS_LAMBDA_URL,
  process.env.USE_LOCAL_EXECUTION_FALLBACK === 'true'
)

// Initialize analytics and AI mentor systems for Phase 1A integration
// Start with individual components, then move to integrated FeedbackFlywheel later

// Initialize basic analytics components  
const eventTracker = new EventTracker({ debug_mode: true })
const analyticsCollector = new AnalyticsCollector({ debug_mode: true })

// Create quality thresholds
const qualityThresholds = {
  min_completion_rate: 0.7,
  max_abandonment_rate: 0.3,
  min_success_rate: 0.8,
  max_average_time_minutes: 30,
  max_error_frequency: 0.2,
  min_satisfaction_score: 4.0
}

const qualityMetrics = new QualityMetrics(analyticsCollector, qualityThresholds, { debug_mode: true })

// Helper function to convert BaseCapsule to UniversalCapsule-like structure
function convertBaseCapsuleToUniversalFormat(baseCapsule: BaseCapsule): any {
  try {
    console.log('🔍 Converting BaseCapsule:', {
      id: baseCapsule.id,
      type: baseCapsule.capsule_type,
      hasConfigData: !!baseCapsule.config_data,
      configKeys: baseCapsule.config_data ? Object.keys(baseCapsule.config_data) : [],
      testCasesCount: (baseCapsule.config_data as any)?.test_cases?.length || 0,
      sampleTestCase: (baseCapsule.config_data as any)?.test_cases?.[0] || null
    })
  
  const configData = baseCapsule.config_data as any
  
  // Extract content based on capsule type with better fallbacks
  let content: any = { 
    primary: {
      problemStatement: baseCapsule.problem_statement_md || baseCapsule.title || "AI-generated coding exercise"
    }
  }
  
  if (baseCapsule.capsule_type === 'CODE') {
    console.log('🔧 Processing CODE capsule, configData:', JSON.stringify(configData, null, 2))
    const rawTestCases = configData.test_cases || configData.testCases
    console.log('🧪 rawTestCases:', typeof rawTestCases, Array.isArray(rawTestCases), rawTestCases)
    
    // Handle test cases that come as a string (parse into array)
    let testCases = []
    if (Array.isArray(rawTestCases)) {
      testCases = rawTestCases
    } else if (typeof rawTestCases === 'string') {
      // Split by common delimiters and create test case objects
      const testStrings = rawTestCases.split(/\n\n|\n---\n|; |;(?=\s*test_call)|(?=test_call:)/).filter(str => str.trim())
      testCases = testStrings.map((testStr, index) => {
        if (testStr.includes('test_call:')) {
          const parts = testStr.split('test_call:')
          return {
            test_call: parts[1]?.trim() || testStr.trim(),
            description: `Test case ${index + 1}`,
            expected_output: 'Expected output based on test_call'
          }
        }
        return {
          test_call: testStr.trim(),
          description: `Test case ${index + 1}`,
          expected_output: 'Expected output'
        }
      })
    }
    
    console.log('🧪 testCases after processing:', typeof testCases, Array.isArray(testCases), testCases.length)
    
    // Convert from new input_args format to UI format
    const formattedTestCases = testCases.map((testCase: any, index: number) => {
      if (typeof testCase === 'string') {
        return {
          id: index + 1,
          name: testCase,
          input: `"test_input_${index + 1}"`,
          expected: `"expected_output_${index + 1}"`,
          description: testCase,
          input_args: [],
          expected_output: null
        }
      }
      
      // NEW FORMAT: input_args + expected_output
      if (testCase.input_args !== undefined) {
        // Serialize expected_output if it's a complex object (for SQL results)
        let expectedDisplay = testCase.expected_output
        if (expectedDisplay && typeof expectedDisplay === 'object') {
          expectedDisplay = JSON.stringify(expectedDisplay)
        }
        
        return {
          id: index + 1,
          name: testCase.description || `Test case ${index + 1}`,
          input: JSON.stringify(testCase.input_args), // For display
          expected: expectedDisplay,
          description: testCase.description || `Test case ${index + 1}`,
          input_args: testCase.input_args, // Keep original for validation
          expected_output: testCase.expected_output,
          is_hidden: testCase.is_hidden || false
        }
      }
      
      // OLD FORMAT: Fallback for legacy test_call format
      let input = testCase.test_call || testCase.input
      let expected = testCase.expected_output || testCase.expected
      
      // Parse test_call to extract actual input values
      if (testCase.test_call && testCase.test_call.includes('(')) {
        const match = testCase.test_call.match(/\((.*?)\)/)
        if (match) {
          input = match[1] || input
        }
      }
      
      // Serialize complex objects (SQL results) to JSON strings for React rendering
      if (expected && typeof expected === 'object') {
        expected = JSON.stringify(expected)
      }
      
      return {
        id: index + 1,
        name: testCase.description || `Test case ${index + 1}`,
        input: input || `"test_input_${index + 1}"`,
        expected: expected || `"expected_output_${index + 1}"`,
        description: testCase.description || `Test case ${index + 1}`,
        functionCall: testCase.test_call || null,
        input_args: testCase.input_args,
        expected_output: testCase.expected_output
      }
    })
    
    content.primary.code = {
      wasmVersion: {
        starterCode: configData.boilerplate_code || configData.starterCode || "// TODO: Implement your solution here\nfunction solution() {\n    // Your code here\n}",
        solution: configData.reference_solution || configData.solution || "// Solution not available",
        testCases: formattedTestCases.length > 0 ? formattedTestCases : [
          {
            input: '"test_input"',
            expected: '"expected_output"',
            description: "Default test case"
          }
        ],
        language: baseCapsule.runtime_config?.language || 'javascript',
        complexity: 'easy'
      }
    }
  } else if (baseCapsule.capsule_type === 'DATABASE') {
    // Handle both old format (schema_definition) and new format (schema_setup)
    let schemaSetup = configData.schema_setup || []
    const testDataSetup = configData.test_data_setup || []
    
    // Fallback: If schema_setup is empty, try to extract schema from test cases
    if (schemaSetup.length === 0 && configData.test_cases && configData.test_cases.length > 0) {
      const firstTestCase = configData.test_cases[0]
      if (firstTestCase.schema_setup && firstTestCase.schema_setup.length > 0) {
        schemaSetup = firstTestCase.schema_setup
        console.log(`📝 Extracted schema_setup from first test case (${schemaSetup.length} statements)`)
      }
    }
    
    // Create clean starter query template without any solution hints
    // Don't use boilerplate_code as it often contains the solution in comments
    const starterQuery = "-- Write your SQL query below\n-- Use the schema provided in the Schema Browser\n\nSELECT -- Add your SELECT statement here"
    
    content.primary.database = {
      // Convert schema_setup array to single schema string for backward compatibility
      schema: configData.schema_definition || (schemaSetup.length > 0 ? schemaSetup.join('\n\n') : ""),
      seedData: configData.seed_data || testDataSetup,
      starterQuery: starterQuery,
      solution: configData.reference_solution || "-- Solution not available",
      testCases: configData.test_cases || [],
      // Preserve SQL-specific fields from coder-agent for validation/execution
      schema_setup: schemaSetup,
      test_data_setup: testDataSetup,
      expected_result: configData.expected_result || null
    }
  } else if (baseCapsule.capsule_type === 'TERMINAL') {
    content.primary.terminal = {
      commands: configData.boilerplate_commands || [],
      expectedOutputs: configData.expected_outputs || [],
      hints: configData.hints || []
    }
  }
  
  // Parse markdown description properly
  let cleanDescription = baseCapsule.problem_statement_md || baseCapsule.title || "AI-generated exercise"
  
  // More aggressive markdown cleaning
  cleanDescription = cleanDescription
    .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers at start of lines
    .replace(/#{1,6}\s+/g, '') // Remove any remaining markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
    .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
    .replace(/^\s*-\s*/gm, '• ') // Convert markdown lists to bullet points
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
    .trim()
  
  // If description is still very long with sections, extract just the main problem description
  const sections = cleanDescription.split(/(?:\n\s*){2,}/)
  if (sections.length > 1 && sections[0].length > 50) {
    // Use the first substantial section as the main description
    cleanDescription = sections[0].trim()
  }
  
  // Extract hints from config data with better fallbacks
  const hints = configData.hints || configData.hint_sequence || []
  const formattedHints = hints.map((hint: any, index: number) => {
    if (typeof hint === 'string') {
      return {
        content: hint,
        trigger: 'on_request'
      }
    }
    return {
      content: hint.content || hint.text || `Hint ${index + 1}`,
      trigger: hint.trigger || 'on_request'
    }
  })

  // Log conversion summary based on capsule type
  if (baseCapsule.capsule_type === 'DATABASE') {
    console.log('✅ Conversion complete:', {
      title: baseCapsule.title,
      descriptionPreview: cleanDescription.substring(0, 100),
      descriptionLength: cleanDescription.length,
      starterQueryPreview: content.primary?.database?.starterQuery?.substring(0, 100),
      hasDatabase: !!content.primary?.database,
      schemaSetupCount: content.primary?.database?.schema_setup?.length || 0,
      testCasesCount: content.primary?.database?.testCases?.length || 0,
      hasSolution: !!content.primary?.database?.solution
    })
  } else {
    console.log('✅ Conversion complete:', {
      title: baseCapsule.title,
      descriptionPreview: cleanDescription.substring(0, 100),
      descriptionLength: cleanDescription.length,
      starterCodePreview: content.primary?.code?.wasmVersion?.starterCode?.substring(0, 100),
      hasCode: !!content.primary?.code,
      testCasesCount: content.primary?.code?.wasmVersion?.testCases?.length || 0
    })
  }

  // Map capsule_type to frontend type
  let capsuleType = baseCapsule.capsule_type?.toLowerCase() || 'code'
  // For DATABASE capsules with SQL language, use 'sql' type for frontend
  if (capsuleType === 'database' && (baseCapsule.runtime_config?.language || '').toLowerCase() === 'sql') {
    capsuleType = 'sql'
  }

  return {
    id: baseCapsule.id,
    title: baseCapsule.title || 'Untitled Capsule',
    description: cleanDescription,
    type: capsuleType,
    language: baseCapsule.runtime_config?.language || 'javascript',
    difficulty: 'medium', // Default, could be extracted from context
    content: content,
    runtime: {
      target: 'wasm',
      language: baseCapsule.runtime_config?.language || 'javascript',
      constraints: {
        target: 'wasm',
        wasmLimitations: {
          noFileSystem: true,
          noNetworking: true,
          memoryLimit: 128,
          executionTimeLimit: 5000,
          allowedLanguages: [baseCapsule.runtime_config?.language || 'javascript'],
          maxCodeComplexity: 3
        }
      },
      tier: 'free',
      costModel: {
        executionCost: 0,
        storageCost: 0.001,
        bandwidthCost: 0.001,
        aiGenerationCost: 0.05
      }
    },
    // Extract pedagogy content from the generated data
    pedagogy: {
      learningObjectives: configData.learning_objectives || [
        "Practice problem-solving skills",
        "Understand fundamental programming concepts"
      ],
      hints: { 
        sequence: formattedHints.length > 0 ? formattedHints : [
          {
            content: "Break down the problem into smaller steps",
            trigger: "on_request"
          }
        ],
        progressive: true,
        contextAware: true
      },
      difficulty: {
        current: "easy",
        progression: ["easy", "medium", "hard"],
        adaptiveScaling: true
      },
      concepts: configData.concepts || []
    },
    business: {
      tier: 'free',
      costOptimization: {
        wasmFirst: true,
        cacheStrategy: 'aggressive',
        bandwidthMinimization: true
      }
    },
    // Additional metadata
    tags: configData.tags || [],
    isPublished: false,
    createdAt: baseCapsule.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  } catch (error) {
    console.error('❌ Error in convertBaseCapsuleToUniversalFormat:', error)
    console.error('❌ BaseCapsule data that caused error:', JSON.stringify(baseCapsule, null, 2))
    
    // Return a minimal fallback structure
    return {
      id: `fallback_${Date.now()}`,
      type: 'code',
      title: baseCapsule.title || "AI-Generated Exercise",
      description: baseCapsule.problem_statement_md || "Generated exercise",
      runtime: 'wasm',
      content: {
        primary: {
          problemStatement: baseCapsule.problem_statement_md || "Generated exercise",
          code: {
            wasmVersion: {
              starterCode: "// TODO: Implement solution",
              solution: "// Solution not available",
              testCases: [{
                input: '"test"',
                expected: '"expected"',
                description: "Test case"
              }],
              language: 'javascript',
              complexity: 'medium'
            }
          }
        }
      },
      learning: { objectives: ['Practice coding'], concepts: ['Programming'], difficulty: 'medium' },
      analytics: { impressions: 0, runs: 0, passRate: '0%' },
      feedback: [], events: [], creatorFeedback: null,
      pedagogy: { hints: [], explanation: "Generated exercise" },
      business: { tier: 'free', costModel: { executionCost: 0, storageCost: 0.001 } }
    }
  }
}

// Create real AI service for GenerationPipeline (Phase 1B: AI Agents)
const realAIService = new AIService({
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  deployment: 'gpt-4o',
  apiVersion: '2024-06-01',
  maxTokens: 2000,
  temperature: 0.7,
  retries: 3
})

// Initialize the new AI Agent Pipeline (Pedagogist → Coder → Debugger)
const generationPipeline = new GenerationPipeline(realAIService, { 
  max_generation_attempts: 3,
  enable_quality_gates: true, // Enable quality gates for AI agents
  save_intermediate_results: true,
  timeout_ms: 60000,
  min_educational_value: 0.7,
  min_technical_quality: 0.8,
  max_debugging_attempts: 2
})

console.log('🤖 AI Agent Pipeline initialized: Pedagogist → Coder → Debugger')

// Create a simple flywheel config for the FeedbackProcessor
const flywheelConfig = {
  metrics_update_interval_hours: 24,
  improvement_analysis_interval_hours: 168,
  quality_thresholds: qualityThresholds,
  auto_regenerate_enabled: false,
  regeneration_threshold_score: 0.6,
  max_regeneration_attempts: 3,
  min_data_points_for_analysis: 50,
  confidence_threshold_for_action: 0.8,
  alert_on_critical_issues: true,
  daily_summary_enabled: true,
  weekly_insights_enabled: true
}

const feedbackProcessor = new FeedbackProcessor(
  flywheelConfig,
  qualityMetrics,
  generationPipeline,
  { debug_mode: true }
)

// Initialize AI mentor
const aiMentor = new AIMentor(realAIService, {
  ai_model: 'gpt-4o-mini',
  enable_caching: true,
  max_ai_calls_per_hour: 100
})

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    ai_service: process.env.AZURE_OPENAI_API_KEY ? 'connected' : 'mock',
    execution_mode: process.env.AWS_LAMBDA_URL ? 'serverless' : 'local',
    aws_gateway: process.env.AWS_LAMBDA_URL || 'not_configured',
    supported_languages: executionEngine.getSupportedLanguages(),
    cdn_storage: r2Storage ? 'cloudflare_r2' : 'disabled',
    queue_execution: USE_QUEUE_EXECUTION ? 'enabled' : 'disabled'
  })
})

// Main generation endpoint
app.post('/api/generate', async (req, res) => {
  console.log(`📥 /api/generate called with: type="${req.body.type}", language="${req.body.language}"`)
  
  try {
    let { 
      prompt, 
      type = 'code', 
      difficulty = 'medium', 
      runtime = 'wasm',
      language = 'javascript'
    } = req.body

    // Auto-detect type based on language if not explicitly set
    if (language === 'sql' && (!type || type === 'code')) {
      type = 'database'
      console.log('🔍 Auto-detected DATABASE type from sql language')
    }

    if (!prompt) {
      return res.status(400).json({ 
        error: 'Prompt is required',
        example: {
          prompt: "Create a function that reverses a string",
          type: "code",
          difficulty: "medium",
          runtime: "wasm",
          language: "javascript"
        }
      })
    }

    console.log(`🚀 Generating ${type} capsule: "${prompt.substring(0, 50)}..."`)

    const config: GenerationConfig = {
      prompt,
      capsuleType: type as 'code' | 'quiz' | 'terminal' | 'database' | 'system-design',
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      runtimeTarget: runtime as 'wasm' | 'docker',
      constraints: runtime === 'wasm' ? {
        target: 'wasm' as const,
        wasmLimitations: {
          noFileSystem: true,
          noNetworking: true,
          memoryLimit: 128,
          executionTimeLimit: 5000,
          allowedLanguages: ['javascript', 'python'],
          maxCodeComplexity: difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7
        }
      } : {
        target: 'docker' as const,
        dockerCapabilities: {
          fileSystemAccess: true,
          networkAccess: true,
          databaseAccess: true,
          externalAPIAccess: true,
          multiFileProjects: true,
          customDependencies: true,
          unlimitedExecution: true
        }
      },
      aiModel: 'gpt-4o',
      useCreatorFeedback: false,
      qualityThreshold: 0.7,
      maxRegenerationAttempts: 1
    }

    // Phase 1B: Use the new AI Agent Pipeline (Pedagogist → Coder → Debugger)
    console.log('🤖 Using AI Agent Pipeline for generation...')
    
    // Convert GenerationConfig to GenerationContext for the new pipeline
    // Auto-detect DATABASE type for SQL language
    let capsuleType = type.toUpperCase() as "CODE" | "DATABASE" | "TERMINAL"
    if (language.toLowerCase() === 'sql') {
      console.log(`🔄 Auto-detecting: language="${language}" → capsuleType="DATABASE"`)
      capsuleType = 'DATABASE'
    }
    
    const context: GenerationContext = {
      type: capsuleType,
      language: language,
      difficulty: difficulty as "easy" | "medium" | "hard",
      userPrompt: prompt,
      targetAudience: difficulty === 'easy' ? 'beginner' : difficulty === 'medium' ? 'intermediate' : 'advanced',
      estimatedTime: difficulty === 'easy' ? 15 : difficulty === 'medium' ? 30 : 45
    }

    try {
      const pipelineResult: PipelineGenerationResult = await generationPipeline.generateCapsule(context)
      
      console.log(`✅ AI Agent Pipeline completed in ${pipelineResult.total_time_ms}ms`)
      console.log(`🎯 Quality: ${(pipelineResult.overall_quality * 100).toFixed(1)}% (Educational: ${(pipelineResult.educational_score * 100).toFixed(1)}%, Technical: ${(pipelineResult.technical_score * 100).toFixed(1)}%)`)
      console.log(`🤖 Agents used: ${pipelineResult.agents_used.join(' → ')}`)

      res.json({
        success: true,
        capsule: convertBaseCapsuleToUniversalFormat(pipelineResult.capsule),
        metadata: {
          generationId: `pipeline_${Date.now()}`,
          timestamp: new Date(),
          modelUsed: 'ai-agent-pipeline',
          generationTime: pipelineResult.total_time_ms,
          agentChain: pipelineResult.agents_used,
          qualityScore: pipelineResult.overall_quality
        },
        qualityScore: pipelineResult.overall_quality,
        suggestions: pipelineResult.warnings || [],
        // New pipeline-specific fields
        pipeline: {
          educational_score: pipelineResult.educational_score,
          technical_score: pipelineResult.technical_score,
          agents_used: pipelineResult.agents_used,
          agent_timings: pipelineResult.agent_timings,
          pedagogical_idea: pipelineResult.pedagogical_idea
        }
      })
    } catch (error) {
      console.warn('🔄 AI Agent Pipeline failed, falling back to original engine:', (error as Error).message)
      
      // Fallback to original generation engine
      const result: GenerationResult = await generationEngine.generateCapsule(config)

      res.json({
        success: true,
        capsule: result.capsule,
        metadata: result.generationMetadata,
        qualityScore: result.qualityScore,
        suggestions: result.suggestions,
        fallback: true
      })
    }

  } catch (error) {
    console.error('Generation failed:', error)
    res.status(500).json({ 
      error: 'Generation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
})

// Quick test endpoint for simple code generation
app.post('/api/generate/simple', async (req, res) => {
  try {
    const { prompt } = req.body
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    const config: GenerationConfig = {
      prompt,
      capsuleType: 'code',
      difficulty: 'medium',
      runtimeTarget: 'wasm',
      constraints: {
        target: 'wasm',
        wasmLimitations: {
          noFileSystem: true,
          noNetworking: true,
          memoryLimit: 128,
          executionTimeLimit: 5000,
          allowedLanguages: ['javascript'],
          maxCodeComplexity: 5
        }
      },
      aiModel: 'gpt-4o',
      useCreatorFeedback: false,
      qualityThreshold: 0.7,
      maxRegenerationAttempts: 1
    }

    // Phase 1B: Use AI Agent Pipeline for simple generation too
    const context: GenerationContext = {
      type: "CODE",
      language: "javascript", // Default for simple generation
      difficulty: "medium",
      userPrompt: prompt,
      targetAudience: 'intermediate',
      estimatedTime: 30
    }

    try {
      const pipelineResult: PipelineGenerationResult = await generationPipeline.generateCapsule(context)
      
      const convertedCapsule = convertBaseCapsuleToUniversalFormat(pipelineResult.capsule)
      res.json({
        success: true,
        title: convertedCapsule.title,
        description: convertedCapsule.description,
        content: convertedCapsule.content,
        runtime: convertedCapsule.runtime,
        qualityScore: pipelineResult.overall_quality,
        // Pipeline-specific data
        pipeline: {
          educational_score: pipelineResult.educational_score,
          technical_score: pipelineResult.technical_score,
          agents_used: pipelineResult.agents_used,
          pedagogical_idea: pipelineResult.pedagogical_idea
        }
      })
    } catch (error) {
      console.warn('🔄 Simple generation AI Pipeline failed, using fallback:', (error as Error).message)
      
      // Fallback to original engine
      const result = await generationEngine.generateCapsule(config)

      res.json({
        success: true,
        title: result.capsule.title,
        description: result.capsule.description,
        content: result.capsule.content,
        runtime: result.capsule.runtime,
        qualityScore: result.qualityScore,
        fallback: true
      })
    }

  } catch (error) {
    console.error('Simple generation failed:', error)
    res.status(500).json({ 
      error: 'Generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Test AI service connection
app.get('/api/test-ai', async (req, res) => {
  try {
    if (!process.env.AZURE_OPENAI_API_KEY) {
      return res.json({
        status: 'mock',
        message: 'Using mock AI responses. Set AZURE_OPENAI_API_KEY for real AI generation.'
      })
    }

    // Simple test generation
    const config: GenerationConfig = {
      prompt: "Simple hello world function",
      capsuleType: 'code',
      difficulty: 'easy',
      runtimeTarget: 'wasm',
      constraints: {
        target: 'wasm',
        wasmLimitations: {
          noFileSystem: true,
          noNetworking: true,
          memoryLimit: 128,
          executionTimeLimit: 5000,
          allowedLanguages: ['javascript'],
          maxCodeComplexity: 3
        }
      },
      aiModel: 'gpt-4o',
      useCreatorFeedback: false,
      qualityThreshold: 0.7,
      maxRegenerationAttempts: 1
    }

    const result = await generationEngine.generateCapsule(config)

    res.json({
      status: 'connected',
      message: 'AI service is working',
      testResult: {
        generatedTitle: result.capsule.title,
        qualityScore: result.qualityScore,
        tokensUsed: result.generationMetadata.tokensUsed
      }
    })

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'AI service test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Code execution endpoints
app.post('/api/execute', async (req, res) => {
  try {
    const {
      source_code,
      language,
      input = '',
      time_limit = 10,
      memory_limit = 128
    } = req.body

    if (!source_code) {
      return res.status(400).json({
        error: 'source_code is required',
        example: {
          source_code: 'print("Hello World")',
          language: 'python',
          input: '',
          time_limit: 10,
          memory_limit: 128
        }
      })
    }

    if (!language) {
      return res.status(400).json({
        error: 'language is required',
        supported_languages: executionEngine.getSupportedLanguages()
      })
    }

    console.log(`⚡ Executing ${language} code: "${source_code.substring(0, 50)}..."`)

    let result;
    
    // Use Piston queue for supported languages when enabled
    if (USE_QUEUE_EXECUTION && (language === 'python' || language === 'javascript' || language === 'java' || language === 'cpp' || language === 'c')) {
      console.log(`🚀 Using Piston Queue execution for ${language}`)
      result = await executionQueue.executeSync(
        language,
        source_code,
        input,
        time_limit
      )
    } else {
      // Fallback to Lambda execution
      result = await executionEngine.executeCode(
        source_code,
        language,
        input,
        time_limit,
        memory_limit
      )
    }

    res.json({
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      exit_code: result.exit_code,
      execution_time: result.execution_time,
      memory_used: result.memory_used,
      compile_output: result.compile_output,
      error: result.error,
      timestamp: result.timestamp
    })

  } catch (error) {
    console.error('Code execution failed:', error)
    res.status(500).json({
      success: false,
      error: 'Execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    })
  }
})

// Test Case Execution endpoint - Run user code against test cases
app.post('/api/execute-tests', async (req, res) => {
  try {
    const {
      userCode,
      testCases,
      language,
      functionName,
      schema_setup,
      referenceSolution
    } = req.body

    if (!userCode || !testCases || !language) {
      return res.status(400).json({
        error: 'userCode, testCases, and language are required',
        example: {
          userCode: 'function add(a, b) { return a + b; }',
          testCases: [
            { input: 'add(2, 3)', expected: 5, description: 'Basic addition' }
          ],
          language: 'javascript',
          functionName: 'add'
        }
      })
    }

    // Handle SQL execution separately
    if (language === 'sql') {
      try {
        console.log('🗄️ Executing SQL validation')
        console.log('Test cases received:', JSON.stringify(testCases, null, 2))
        
        // Validate testCases structure
        if (!Array.isArray(testCases) || testCases.length === 0) {
          console.log('❌ No valid test cases provided for SQL execution')
          return res.status(400).json({
            error: 'SQL execution requires at least one test case',
            received: { testCases, type: typeof testCases, length: testCases?.length }
          })
        }
        
        // Use the first test case for validation
        const testCase = testCases[0]
        if (!testCase) {
          return res.status(400).json({
            error: 'First test case is undefined',
            testCases
          })
        }
        
        // Safely access expected_output with multiple fallbacks and parse JSON strings
        let expectedOutput = testCase?.expected_output || testCase?.expected || testCase?.output || []
        
        // If expected output is a JSON string, parse it
        if (typeof expectedOutput === 'string') {
          try {
            expectedOutput = JSON.parse(expectedOutput)
          } catch (e) {
            console.log('⚠️ Failed to parse expected output as JSON, using as string:', expectedOutput)
          }
        }
        
        const requiresPostgres = testCase?.requires_postgres || false
        
        const requestPayload = {
          user_query: userCode,
          reference_solution: testCase?.reference_solution || testCase?.solution || referenceSolution || userCode,
          schema_setup: schema_setup || [],
          expected_output: expectedOutput,
          requires_postgres: requiresPostgres,
          validate_approach: true, // Enable approach validation
          check_query_structure: true // Enable structure validation
        }
        
        console.log('🚀 Sending to AWS Lambda:', JSON.stringify(requestPayload, null, 2))
        
        const apiUrl = process.env.AWS_API_GATEWAY_URL || 'https://q0qr0uqja7.execute-api.us-east-1.amazonaws.com/dev'
        const validationResponse = await fetch(`${apiUrl}/validate/sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload)
        })

        if (!validationResponse.ok) {
          const errorText = await validationResponse.text()
          console.error('🚨 Lambda validation error:', {
            status: validationResponse.status,
            statusText: validationResponse.statusText,
            body: errorText
          })
          throw new Error(`SQL validation failed: ${validationResponse.status} - ${errorText}`)
        }

        const validationResult = await validationResponse.json()
        console.log('✅ Lambda validation result:', validationResult)
        
        // Format response for embed
        return res.json({
          success: validationResult.success,
          results: {
            data: validationResult.user_result || [],
            columns: validationResult.columns || []
          },
          expected: expectedOutput,
          diff: validationResult.message || '',
          error: validationResult.error,
          timestamp: Date.now()
        })
        
      } catch (error) {
        console.error('SQL execution failed:', error)
        return res.status(500).json({
          success: false,
          error: 'SQL execution failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        })
      }
    }

    const results = []
    let passedTests = 0

    console.log(`🧪 Running ${testCases.length} test cases for ${language} code`)

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i]
      
      // Build the function call - if input is just a value, wrap it with functionName
      let functionCall
      if (testCase.functionCall) {
        functionCall = testCase.functionCall
      } else if (testCase.input && testCase.input.includes('(')) {
        // Input already contains function call like "isPrime(2)"
        functionCall = testCase.input
      } else {
        // Input is just a parameter value like "2", wrap with function name
        functionCall = `${functionName}(${testCase.input || testCase.inputValue || ''})`
      }
      
      // Build test code that combines user code + test case
      let testCode = ''
      
      // LAYER 1: Use base64 encoding to avoid syntax errors from special characters
      const testDataObj = {
        function_call: functionCall,
        expected: testCase.expected,
        test_num: i + 1
      }
      const testDataBase64 = Buffer.from(JSON.stringify(testDataObj)).toString('base64')
      
      if (language === 'javascript') {
        testCode = `
${userCode}

// Test case ${i + 1} - Using base64 encoded test data
const testDataB64 = "${testDataBase64}";
const testData = JSON.parse(Buffer.from(testDataB64, 'base64').toString('utf-8'));

try {
  const result = eval(testData.function_call);
  const expected = testData.expected;
  
  console.log('Test ' + testData.test_num + ': Input=' + testData.function_call);
  console.log('Test ' + testData.test_num + ': Result=' + JSON.stringify(result));
  console.log('Test ' + testData.test_num + ': Expected=' + JSON.stringify(expected));
  
  if (JSON.stringify(result) === JSON.stringify(expected)) {
    console.log('✅ PASS');
  } else {
    console.log('❌ FAIL');
    process.exit(1);
  }
} catch (error) {
  console.log('💥 ERROR: ' + error.message);
  process.exit(1);
}
`

      } else if (language === 'python') {
        // LAYER 1+2: Base64 encoding + random.seed for deterministic testing
        testCode = `# LAYER 2: Force determinism - seed random BEFORE user code
import random
import sys
random.seed(42)
try:
    import numpy as np
    np.random.seed(42)
except ImportError:
    pass

${userCode}

# Test case ${i + 1} - Using base64 encoded test data
import json
import base64

test_data_b64 = "${testDataBase64}"

try:
    test_data = json.loads(base64.b64decode(test_data_b64).decode('utf-8'))
    result = eval(test_data['function_call'])
    expected = test_data['expected']
    test_num = test_data['test_num']
    
    print(f'Test {test_num}: Input={test_data["function_call"]}')
    print(f'Test {test_num}: Result={result}')
    print(f'Test {test_num}: Expected={expected}')
    
    if result == expected:
        print('PASS')
    else:
        print('FAIL')
        sys.exit(1)
        
except Exception as error:
    print(f'ERROR: {error}')
    sys.exit(1)`
      }

      // Execute the test - use queue for supported languages if enabled
      try {
        let executionResult;
        
        if (USE_QUEUE_EXECUTION && (language === 'python' || language === 'javascript' || language === 'java' || language === 'cpp' || language === 'c')) {
          // Use EC2 Piston Queue execution
          console.log(`🚀 Using Queue execution for ${language}`)
          executionResult = await executionQueue.executeSync(
            language,
            testCode,
            testCase.input || '',
            15 // 15 second timeout
          )
        } else {
          // Fallback to Lambda execution
          executionResult = await executionEngine.executeCode(
            testCode,
            language as 'python' | 'javascript' | 'sql' | 'java' | 'csharp' | 'go',
            testCase.input || '',
            10, // 10 second timeout
            256 // 256MB memory limit
          )
        }

        const testResult = {
          testCase: i + 1,
          description: testCase.description || testCase.name || `Test case ${i + 1}`,
          input: testCase.input || testCase.functionCall,
          expected: testCase.expected,
          passed: executionResult.success && (executionResult.exit_code === 0 || executionResult.exit_code === undefined),
          output: executionResult.stdout || '',
          error: executionResult.stderr || executionResult.error || '',
          executionTime: executionResult.execution_time || 0
        }

        if (testResult.passed) {
          passedTests++
        }

        results.push(testResult)
        
        console.log(`${testResult.passed ? '✅' : '❌'} Test ${i + 1}: ${testResult.description}`)

      } catch (error) {
        const testResult = {
          testCase: i + 1,
          description: testCase.description || `Test case ${i + 1}`,
          input: testCase.input || testCase.functionCall,
          expected: testCase.expected,
          passed: false,
          output: '',
          error: error instanceof Error ? error.message : 'Execution failed',
          executionTime: 0
        }
        
        results.push(testResult)
        console.log(`❌ Test ${i + 1}: Execution failed - ${testResult.error}`)
      }
    }

    const summary = {
      totalTests: testCases.length,
      passedTests,
      failedTests: testCases.length - passedTests,
      successRate: (passedTests / testCases.length) * 100,
      allPassed: passedTests === testCases.length
    }

    res.json({
      success: true,
      summary,
      results,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('Test execution failed:', error)
    res.status(500).json({
      success: false,
      error: 'Test execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    })
  }
})

// Debug endpoint to test generation pipeline
app.post('/api/debug/generation', async (req, res) => {
  try {
    console.log('🔍 Testing generation pipeline...')
    
    const testContext: GenerationContext = {
      type: "CODE",
      language: "javascript",
      difficulty: "easy",
      userPrompt: "Create a simple hello world function",
      targetAudience: "beginner",
      estimatedTime: 15
    }
    
    console.log('🔍 Test context:', testContext)
    console.log('🔍 Generation pipeline exists:', !!generationPipeline)
    console.log('🔍 Generation pipeline type:', typeof generationPipeline)
    
    const result = await generationPipeline.generateCapsule(testContext)
    
    res.json({
      success: true,
      message: "Generation pipeline is working",
      result: {
        quality: result.overall_quality,
        time: result.total_time_ms,
        warnings: result.warnings
      }
    })
  } catch (error) {
    console.error('🔍 Debug generation failed:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null,
      type: typeof error,
      details: error
    })
  }
})

// Combined generation + execution endpoint
app.post('/api/generate-and-execute', async (req, res) => {
  console.log(`📥 /api/generate-and-execute called with: type="${req.body.type}", language="${req.body.language}"`)
  
  try {
    let {
      prompt,
      language = 'javascript',
      difficulty = 'medium',
      input = '',
      archetype = 'generated',
      type = 'code'
    } = req.body

    // Auto-detect type based on language if not explicitly set
    if (language === 'sql' && (!type || type === 'code')) {
      type = 'database'
      console.log('🔍 Auto-detected DATABASE type from sql language')
    }

    if (!prompt) {
      return res.status(400).json({
        error: 'prompt is required',
        example: {
          prompt: 'Create a function that calculates factorial',
          language: 'javascript',
          difficulty: 'medium',
          input: '5'
        }
      })
    }

    console.log(`🔄 Generate + Execute: "${prompt.substring(0, 50)}..." in ${language}`)

    // Step 1: Generate capsule using AI
    const config: GenerationConfig = {
      prompt,
      capsuleType: type as 'code' | 'database' | 'terminal' | 'quiz' | 'system-design',
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      runtimeTarget: 'wasm', // Will be executed via serverless instead
      constraints: {
        target: 'wasm',
        wasmLimitations: {
          noFileSystem: true,
          noNetworking: true,
          memoryLimit: 128,
          executionTimeLimit: 5000,
          allowedLanguages: [language], // Remove casting to ensure language is passed correctly
          maxCodeComplexity: difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7
        }
      },
      allowedLanguages: [language], // Pass language constraint to top level
      aiModel: 'gpt-4o',
      useCreatorFeedback: false,
      qualityThreshold: 0.7,
      maxRegenerationAttempts: 2
    }

    // Phase 1B: Use AI Agent Pipeline for generate-and-execute
    const context: GenerationContext = {
      type: type.toUpperCase() as "CODE" | "DATABASE" | "TERMINAL",
      language: language,
      difficulty: difficulty as "easy" | "medium" | "hard",
      userPrompt: prompt,
      targetAudience: difficulty === 'easy' ? 'beginner' : difficulty === 'medium' ? 'intermediate' : 'advanced',
      estimatedTime: difficulty === 'easy' ? 15 : difficulty === 'medium' ? 30 : 45
    }

    let generationResult: OldGenerationResult
    try {
      const pipelineResult: PipelineGenerationResult = await generationPipeline.generateCapsule(context)
      
      // Convert pipeline result to GenerationResult format for compatibility
      generationResult = {
        capsule: convertBaseCapsuleToUniversalFormat(pipelineResult.capsule),
        generationMetadata: {
          generationId: `pipeline_${Date.now()}`,
          timestamp: new Date(),
          modelUsed: 'ai-agent-pipeline',
          tokensUsed: 0, // Pipeline doesn't track tokens yet
          generationTime: pipelineResult.total_time_ms,
          attempts: 1,
          promptVersion: 'pipeline-1.0',
          feedbackUsed: []
        },
        qualityScore: pipelineResult.overall_quality,
        suggestions: pipelineResult.warnings || []
      }
      
      console.log(`🤖 AI Pipeline generation completed in ${pipelineResult.total_time_ms}ms (Quality: ${(pipelineResult.overall_quality * 100).toFixed(1)}%)`)
    } catch (error) {
      console.error('❌ Generation pipeline failed:', (error as Error).message)
      console.error('❌ Full error stack:', (error as Error).stack)
      console.error('❌ Error details:', error)
      return res.status(500).json({
        success: false,
        error: 'Generation pipeline failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        timestamp: Date.now()
      })
    }
    
    // Step 1.5: Capsule generated successfully (kept in memory only)
    console.log(`✅ Capsule generated successfully: "${generationResult.capsule.title}"`)
    console.log(`📊 Quality Score: ${(generationResult.qualityScore * 100).toFixed(1)}%`)
    console.log(`💡 Note: Capsule not saved to database - use publish endpoint to save`)
    
    // Step 2: Return generated capsule (no automatic execution)
    res.json({
      success: true,
      capsule: generationResult.capsule,
      metadata: generationResult.generationMetadata,
      qualityScore: generationResult.qualityScore,
      suggestions: generationResult.suggestions,
      instructions: {
        next_steps: [
          "Review the generated capsule content",
          "Use POST /api/capsules/validate to test the solution",
          "Use POST /api/capsules/publish to save to database"
        ]
      },
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('Generate + execute failed:', error)
    res.status(500).json({
      success: false,
      error: 'Generation and execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    })
  }
})

// Execution engine health check
app.get('/api/execution/health', async (req, res) => {
  try {
    const health = await executionEngine.healthCheck()
    res.json(health)
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    })
  }
})

// Get supported languages
app.get('/api/execution/languages', (req, res) => {
  res.json({
    supported_languages: executionEngine.getSupportedLanguages(),
    total_count: executionEngine.getSupportedLanguages().length
  })
})

// Capsule management endpoints
app.get('/api/capsules', async (req, res) => {
  try {
    const capsules = await capsuleQueries.getPublishedCapsules({
      limit: 50
    })
    res.json({
      success: true,
      capsules: capsules.map((capsule: any) => ({
        id: capsule.id,
        title: capsule.title,
        description: capsule.description,
        type: capsule.type,
        language: capsule.language,
        difficulty: capsule.difficulty,
        tags: capsule.tags,
        createdAt: capsule.createdAt,
        isPublished: capsule.isPublished
      }))
    })
  } catch (error) {
    console.error('Failed to fetch capsules:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch capsules',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get user's own capsules (including unpublished)
app.get('/api/my-capsules', async (req, res) => {
  try {
    // For now, get all capsules from the default user
    // In production, this would use actual user authentication
    const defaultUser = await userQueries.findOrCreateUser(
      'default-user', 
      'default@devcapsules.com', 
      'Default User'
    )
    
    // Get all capsules for this user (published and unpublished)
    const capsules = await capsuleQueries.getUserCapsules(defaultUser.id)
    
    res.json({
      success: true,
      capsules: capsules.map((capsule: any) => ({
        id: capsule.id,
        title: capsule.title,
        description: capsule.description,
        type: capsule.type,
        language: capsule.language,
        difficulty: capsule.difficulty,
        tags: capsule.tags,
        createdAt: capsule.createdAt,
        isPublished: capsule.isPublished,
        // Add some mock analytics for dashboard display
        analytics: {
          impressions: Math.floor(Math.random() * 1000),
          runs: Math.floor(Math.random() * 500),
          passRate: Math.floor(Math.random() * 100) + '%'
        }
      }))
    })
  } catch (error) {
    console.error('Failed to fetch user capsules:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user capsules',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.get('/api/capsules/:id', async (req, res) => {
  try {
    const { id } = req.params
    const capsule = await capsuleQueries.getCapsuleById(id)
    
    if (!capsule) {
      return res.status(404).json({
        success: false,
        error: 'Capsule not found'
      })
    }
    
    // Add aggressive caching for static capsule content
    res.set({
      'Cache-Control': 'public, max-age=3600, s-maxage=86400', // 1hr browser, 24hr CDN
      'CDN-Cache-Control': 'max-age=86400', // 24hr CDN cache
      'Vary': 'Accept-Encoding'
    })
    
    res.json({
      success: true,
      capsule
    })
  } catch (error) {
    console.error('Failed to fetch capsule:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch capsule',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Validate capsule test cases - should be called before publishing
app.post('/api/capsules/validate', async (req, res) => {
  try {
    const { capsule, testCases } = req.body
    
    if (!capsule || !testCases || !Array.isArray(testCases)) {
      return res.status(400).json({
        success: false,
        error: 'Missing capsule or test cases for validation'
      })
    }
    
    // Extract solution code - support Universal Format (CODE and DATABASE) and BaseCapsule format
    let solutionCode = capsule.content?.primary?.code?.wasmVersion?.solution
    
    // For SQL capsules, check database structure
    if (!solutionCode && capsule.content?.primary?.database?.solution) {
      solutionCode = capsule.content.primary.database.solution
    }
    
    // If not found in Universal Format, try BaseCapsule format
    if (!solutionCode && capsule.config_data) {
      solutionCode = capsule.config_data.reference_solution
    }
    
    if (!solutionCode) {
      console.error('No solution code found. Capsule structure:', JSON.stringify(capsule, null, 2))
      return res.status(400).json({
        success: false,
        error: 'No solution code found in capsule'
      })
    }
    
    console.log(`🧪 Validating ${testCases.length} test cases for capsule: "${capsule.title}"`)
    console.log(`📋 Test cases received:`, JSON.stringify(testCases, null, 2))
    console.log(`🔍 First test case input_args:`, testCases[0]?.input_args, 'type:', typeof testCases[0]?.input_args)
    
    // Handle SQL validation separately
    if (capsule.language?.toLowerCase() === 'sql') {
      try {
        console.log('🗄️ Using SQL validation for capsule')
        
        const validationResults = []
        let allTestsPassed = true
        
        // Extract SQL-specific data
        const schema_setup = capsule.content?.primary?.database?.schema_setup || []
        
        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i]
          const description = testCase.description || testCase.name || `Test case ${i + 1}`
          console.log(`🚀 Running test case ${i + 1}: ${description}`)
          
          try {
            const apiUrl = process.env.AWS_API_GATEWAY_URL || 'https://q0qr0uqja7.execute-api.us-east-1.amazonaws.com/dev'
            const validationResponse = await fetch(`${apiUrl}/validate/sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_query: solutionCode,
                reference_solution: solutionCode,
                schema_setup: schema_setup,
                expected_output: testCase?.expected_output || testCase?.expected || testCase?.output || [],
                requires_postgres: false
              })
            })

            if (!validationResponse.ok) {
              throw new Error(`SQL validation failed: ${validationResponse.status}`)
            }

            const validationResult = await validationResponse.json()
            
            validationResults.push({
              testId: i + 1,
              description: description,
              passed: validationResult.success,
              output: validationResult.stdout || '',
              error: validationResult.error || null
            })
            
            if (validationResult.success) {
              console.log(`✅ Test ${i + 1} passed`)
            } else {
              console.log(`❌ Test ${i + 1} failed:`, validationResult.error)
              allTestsPassed = false
            }
            
          } catch (error) {
            console.error(`❌ Test ${i + 1} failed with error:`, error)
            validationResults.push({
              testId: i + 1,
              description: description,
              passed: false,
              output: '',
              error: error instanceof Error ? error.message : 'Unknown error'
            })
            allTestsPassed = false
          }
        }
        
        return res.json({
          success: allTestsPassed,
          validation: {
            allTestsPassed,
            passedCount: validationResults.filter(r => r.passed).length,
            totalCount: validationResults.length,
            results: validationResults
          },
          readyToPublish: allTestsPassed
        })
        
      } catch (error) {
        console.error('❌ SQL validation failed:', error)
        return res.status(500).json({
          success: false,
          error: 'SQL validation failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    const validationResults = []
    let allTestsPassed = true
    
    // Extract function name from solution
    const functionMatch = solutionCode.match(/def\s+(\w+)\s*\(/)
    const functionName = functionMatch ? functionMatch[1] : 'solve'
    
    // Detect if solution is class-based
    const isClass = solutionCode.includes('class ') && solutionCode.includes('def __init__')
    const classMatch = solutionCode.match(/class\s+(\w+)/)
    const className = classMatch ? classMatch[1] : null
    
    // Run each test case with data-driven harness
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i]
      const description = testCase.description || testCase.name || `Test case ${i + 1}`
      console.log(`🚀 Running test case ${i + 1}: ${description}`)
      
      try {
        // Extract input_args - either from the field or parse from input string
        let inputArgs = testCase.input_args
        
        if (!inputArgs && testCase.input) {
          // Parse input string which looks like: "[\"A man, a plan, a canal: Panama\"]"
          try {
            inputArgs = JSON.parse(testCase.input)
          } catch (e) {
            console.warn(`Failed to parse input for test ${i + 1}:`, testCase.input)
            inputArgs = []
          }
        }
        
        // Build data-driven test harness (same as generation pipeline)
        // Use base64 encoding to avoid any escaping issues with special characters
        const testDataObj = {
          input_args: inputArgs || [],
          expected_output: testCase.expected_output !== undefined ? testCase.expected_output : testCase.expected
        }
        const testDataBase64 = Buffer.from(JSON.stringify(testDataObj)).toString('base64')
        
        let testCode: string
        
        if (isClass && className) {
          // Class-based solution
          testCode = `
# LAYER 2: Force determinism - seed random BEFORE user code
import random
import sys
random.seed(42)
try:
    import numpy as np
    np.random.seed(42)
except ImportError:
    pass

${solutionCode}

# Data-driven test harness for class-based solution
import json
import base64

test_data_b64 = "${testDataBase64}"

try:
    test_data = json.loads(base64.b64decode(test_data_b64).decode('utf-8'))
    args = test_data['input_args']
    expected = test_data['expected_output']
    
    # Instantiate the class
    instance = ${className}()
    
    # Set the string and call the method
    if len(args) > 0:
        instance.set_string(args[0])
    
    # Call the is_palindrome method
    actual = instance.is_palindrome()
    
    # Strict comparison
    if actual != expected:
        print(f'TEST FAILED: Expected {expected}, got {actual}')
        sys.exit(1)
    
    print('TEST_PASSED')
except Exception as error:
    print(f'EXECUTION ERROR: {error}')
    sys.exit(1)
`
        } else {
          // Function-based solution
          testCode = `
# LAYER 2: Force determinism - seed random BEFORE user code
import random
import sys
random.seed(42)
try:
    import numpy as np
    np.random.seed(42)
except ImportError:
    pass

${solutionCode}

# Data-driven test harness
import json
import base64

test_data_b64 = "${testDataBase64}"

try:
    test_data = json.loads(base64.b64decode(test_data_b64).decode('utf-8'))
    args = test_data['input_args']
    expected = test_data['expected_output']
    
    # Call function with unpacked arguments
    actual = ${functionName}(*args)
    
    # Strict comparison
    if actual != expected:
        print(f'TEST FAILED: Expected {expected}, got {actual}')
        sys.exit(1)
    
    print('TEST_PASSED')
except Exception as error:
    print(f'EXECUTION ERROR: {error}')
    sys.exit(1)
`
        }
        
        // Use queue execution for Python/JavaScript if enabled
        let executionResult;
        const language = capsule.language || 'python'
        
        if (USE_QUEUE_EXECUTION && (language === 'python' || language === 'javascript')) {
          console.log(`🚀 Using Queue execution for ${language} validation`)
          executionResult = await executionQueue.executeSync(
            language,
            testCode,
            '',
            15 // 15 second timeout
          )
        } else {
          executionResult = await executionEngine.executeCode(
            testCode,
            language,
            '',
            10, // 10 second timeout
            256 // 256MB memory limit
          )
        }
        
        console.log(`📊 Test ${i + 1} execution result:`, {
          success: executionResult.success,
          exit_code: executionResult.exit_code,
          stdout: executionResult.stdout?.substring(0, 200),
          stderr: executionResult.stderr?.substring(0, 200)
        })
        
        const testPassed = executionResult.success && executionResult.exit_code === 0
        
        validationResults.push({
          testCase: i + 1,
          description: description,
          passed: testPassed,
          output: executionResult.stdout,
          error: executionResult.stderr || executionResult.error
        })
        
        if (!testPassed) {
          allTestsPassed = false
          console.log(`❌ Test ${i + 1} failed:`, executionResult.stderr || executionResult.error || 'Unknown error')
        } else {
          console.log(`✅ Test ${i + 1} passed`)
        }
        
      } catch (error) {
        validationResults.push({
          testCase: i + 1,
          description: testCase.description,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        allTestsPassed = false
      }
    }
    
    res.json({
      success: true,
      validation: {
        allTestsPassed,
        passedCount: validationResults.filter(r => r.passed).length,
        totalCount: validationResults.length,
        results: validationResults
      },
      readyToPublish: allTestsPassed
    })
    
  } catch (error) {
    console.error('Test validation failed:', error)
    res.status(500).json({
      success: false,
      error: 'Test validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Publish/Save capsule endpoint - saves generated capsule to database
// REQUIRES: Capsule must be validated first via /api/capsules/validate
app.post('/api/capsules/publish', async (req, res) => {
  try {
    const { capsule, metadata, qualityValidation, validated, skipValidation } = req.body
    
    console.log('📥 Publish request received:', {
      title: capsule?.title,
      type: capsule?.type,
      language: capsule?.language,
      validated: validated,
      skipValidation: skipValidation,
      hasPrimaryDatabase: !!capsule?.content?.primary?.database,
      hasPrimaryCode: !!capsule?.content?.primary?.code
    });
    
    // Validate required fields
    if (!capsule || !capsule.title || !capsule.content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required capsule data (title, content)'
      })
    }
    
    // ENFORCE validation before publishing (unless explicitly skipped for drafts)
    if (!validated && !skipValidation) {
      return res.status(400).json({
        success: false,
        error: 'Capsule must be validated before publishing. Call /api/capsules/validate first.',
        hint: 'Pass validated: true after successful validation, or skipValidation: true to save as draft'
      })
    }
    
    // Optional: Validate quality score if provided
    if (qualityValidation?.enabled && (!metadata?.qualityScore || metadata.qualityScore < 0.7)) {
      return res.status(400).json({
        success: false,
        error: 'Capsule quality too low for publishing',
        qualityScore: metadata?.qualityScore || 0,
        minRequired: 0.7
      })
    }
    
    // Create or get user
    const defaultUser = await userQueries.findOrCreateUser(
      'default-user', 
      'default@devcapsules.com', 
      'Default User'
    )
    
    // Map to database format
    // Map 'SQL' type to 'DATABASE' for database storage
    let capsuleType = (capsule.type?.toUpperCase() || 'CODE');
    if (capsuleType === 'SQL') {
      capsuleType = 'DATABASE';
    }
    
    const capsuleData = {
      title: capsule.title,
      description: capsule.description,
      type: capsuleType as 'CODE' | 'DATABASE' | 'TERMINAL',
      difficulty: (capsule.difficulty?.toUpperCase() || 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD',
      language: capsule.language || 'javascript',
      tags: capsule.tags || ['generated'],
      content: capsule.content,
      runtime: capsule.runtime || {},
      pedagogy: capsule.pedagogy || {},
      business: capsule.business || {},
      creatorId: defaultUser.id,
      isPublished: req.body.publish === true // Allow saving as draft or published
    }
    
    const savedCapsule = await capsuleQueries.createCapsule(capsuleData)
    
    // Upload to R2/CDN for fast reads (Phase 2 optimization)
    if (r2Storage && savedCapsule.isPublished) {
      await r2Storage.uploadCapsuleJSON(savedCapsule.id, savedCapsule)
    }
    
    console.log(`🚀 Published capsule to database: ${savedCapsule.id}${r2Storage && savedCapsule.isPublished ? ' + CDN' : ''}`)
    
    res.json({
      success: true,
      capsule: {
        id: savedCapsule.id,
        title: savedCapsule.title,
        isPublished: savedCapsule.isPublished,
        createdAt: savedCapsule.createdAt
      },
      message: savedCapsule.isPublished ? 'Capsule published successfully!' : 'Capsule saved as draft'
    })
    
  } catch (error) {
    console.error('Failed to publish capsule:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to publish capsule',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update capsule endpoint
app.put('/api/capsules/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, type, content, runtime, pedagogy, isPublished } = req.body
    
    // Validate that at least one field is provided
    if (!title && !description && !type && !content && !runtime && !pedagogy && isPublished === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for update'
      })
    }
    
    console.log(`📝 Updating capsule ${id}:`, { 
      title: title || 'unchanged',
      type: type || 'unchanged',
      hasContent: !!content,
      isPublished
    })
    
    const updatedCapsule = await capsuleQueries.updateCapsule(id, {
      title,
      description,
      type,
      content,
      runtime,
      pedagogy,
      isPublished
    })
    
    // Update R2/CDN if capsule is published (Phase 2 optimization)
    if (r2Storage && updatedCapsule && updatedCapsule.isPublished) {
      await r2Storage.uploadCapsuleJSON(id, updatedCapsule)
    }
    
    console.log(`✅ Capsule updated successfully: ${updatedCapsule.title}${r2Storage && updatedCapsule?.isPublished ? ' + CDN' : ''}`)
    
    res.json({
      success: true,
      capsule: updatedCapsule
    })
  } catch (error) {
    console.error('Failed to update capsule:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update capsule',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Debug endpoint to examine generated content structure
app.post('/api/debug/generate', async (req, res) => {
  try {
    const { prompt = "Create a simple hello world function" } = req.body

    const config: GenerationConfig = {
      prompt,
      capsuleType: 'code',
      difficulty: 'easy',
      runtimeTarget: 'wasm',
      constraints: {
        target: 'wasm',
        wasmLimitations: {
          noFileSystem: true,
          noNetworking: true,
          memoryLimit: 128,
          executionTimeLimit: 5000,
          allowedLanguages: ['javascript'],
          maxCodeComplexity: 3
        }
      },
      aiModel: 'gpt-4o',
      useCreatorFeedback: false,
      qualityThreshold: 0.7,
      maxRegenerationAttempts: 1
    }

    const result = await generationEngine.generateCapsule(config)
    
    res.json({
      success: true,
      debug: {
        fullStructure: JSON.stringify(result.capsule, null, 2),
        contentPrimary: result.capsule.content.primary,
        hasCode: !!result.capsule.content.primary.code,
        codeStructure: result.capsule.content.primary.code ? Object.keys(result.capsule.content.primary.code) : null
      }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Widget/Embed endpoints with retry mechanism
app.get('/api/widgets/:id', async (req, res) => {
  const maxRetries = 3
  const { id } = req.params
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Import connection management functions
      const { ensurePrismaConnection, disconnectPrisma } = await import('../../../packages/database/src/client')
      
      // Force disconnect and reconnect for each retry
      await disconnectPrisma()
      await new Promise(resolve => setTimeout(resolve, attempt * 100)) // Progressive delay
      await ensurePrismaConnection()
    
    // Fetch capsule data for the widget
    const capsule = await capsuleQueries.getCapsuleById(id)
    
    if (!capsule) {
      return res.status(404).json({
        success: false,
        error: 'Widget not found'
      })
    }
    
    // Transform capsule data for embed widget format
    const content = capsule.content as any || {}
    const widget = {
      id: capsule.id,
      title: capsule.title,
      description: capsule.description,
      language: content.language || 'javascript',
      difficulty: content.difficulty || 'medium',
      problemStatement: content.problemStatement || capsule.description,
      starterCode: content.solutionStub || '// Your code here',
      testCases: content.testCases || [],
      hints: content.hints || [],
      isPublished: capsule.isPublished,
      createdAt: capsule.createdAt
    }
    
    console.log(`🎨 Widget ${id} fetched successfully:`, widget.title)
      
      console.log(`🎨 Widget ${id} fetched successfully:`, widget.title)
      
      // Set aggressive caching headers - widget data rarely changes
      res.set({
        'Cache-Control': 'public, max-age=3600, s-maxage=86400', // 1 hour browser, 24 hour CDN
        'ETag': `W/"widget-${id}-${widget.createdAt}"`, // Cache invalidation based on creation time
        'Last-Modified': new Date(widget.createdAt).toUTCString()
      })
      
      return res.json({
        success: true,
        widget
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Widget fetch attempt ${attempt}/${maxRetries} failed:`, errorMessage)
      
      // Check if it's a prepared statement error that we can retry
      const isPreparedStatementError = errorMessage.includes('prepared statement') && errorMessage.includes('already exists')
      
      if (isPreparedStatementError && attempt < maxRetries) {
        console.log(`🔄 Retrying widget fetch (attempt ${attempt + 1}/${maxRetries})`)
        // Cleanup connection before retry
        try {
          const { disconnectPrisma } = await import('../../../packages/database/src/client')
          await disconnectPrisma()
        } catch (disconnectError) {
          console.warn('Retry disconnect warning:', disconnectError)
        }
        continue // Retry the loop
      }
      
      // If we've exhausted retries or it's a different error, return failure
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch widget',
        details: errorMessage
      })
    } finally {
      // Always disconnect to prevent prepared statement conflicts
      try {
        const { disconnectPrisma } = await import('../../../packages/database/src/client')
        await disconnectPrisma()
      } catch (disconnectError) {
        console.warn('Widget endpoint disconnect warning:', disconnectError)
      }
    }
  }
})

// Widget execution endpoint for embeds
app.post('/api/widgets/:id/execute', async (req, res) => {
  try {
    const { id } = req.params
    const { code, language } = req.body
    
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required'
      })
    }
    
    console.log(`🚀 Executing code for widget ${id} in ${language}`)
    
    const result = await executionEngine.executeCode(
      code,
      language as SupportedLanguage,
      '', // input
      5,  // timeLimit
      128 // memoryLimit
    )
    
    console.log(`✅ Widget execution completed:`, {
      success: result.success,
      hasOutput: !!result.stdout,
      hasError: !!result.stderr
    })
    
    res.json({
      success: true,
      execution: result
    })
  } catch (error) {
    console.error('Failed to execute widget code:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to execute code',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// SQL Execution Endpoint
app.post('/api/sql/execute', async (req, res) => {
  try {
    const { query, capsuleId } = req.body

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string'
      })
    }

    // For now, simulate SQL execution with mock data
    // In production, this would connect to a real SQL database
    const mockResults = await simulateSQLExecution(query, capsuleId)
    
    res.json(mockResults)
  } catch (error) {
    console.error('SQL execution error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'SQL execution failed'
    })
  }
})

// Terminal Command Execution Endpoint
app.post('/api/terminal/execute', async (req, res) => {
  try {
    const { command, sessionId, capsuleId } = req.body

    if (!command || typeof command !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Command is required and must be a string'
      })
    }

    // For now, simulate terminal command execution
    // In production, this would either use WASM or connect to a real container
    const result = await simulateTerminalExecution(command, sessionId, capsuleId)
    
    res.json(result)
  } catch (error) {
    console.error('Terminal execution error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Terminal execution failed'
    })
  }
})

// Task Validation Endpoint`q 
app.post('/api/terminal/validate', async (req, res) => {
  try {
    const { capsuleId, sessionId } = req.body

    if (!capsuleId) {
      return res.status(400).json({
        success: false,
        error: 'Capsule ID is required'
      })
    }

    // For now, simulate task validation
    // In production, this would run validation scripts against the terminal session
    const validation = await simulateTaskValidation(capsuleId, sessionId)
    
    res.json(validation)
  } catch (error) {
    console.error('Task validation error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Task validation failed'
    })
  }
})

// Terminal Session Management
app.post('/api/terminal/session', async (req, res) => {
  try {
    const { capsuleId, action = 'create' } = req.body

    if (action === 'create') {
      // Create new terminal session
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // In production, this would either:
      // 1. Initialize a WASM Linux environment
      // 2. Spin up a Docker container
      // 3. Create a K8s pod
      
      res.json({
        success: true,
        sessionId,
        type: 'wasm-linux', // or 'server-vm'
        websocketUrl: `ws://localhost:${PORT}/terminal/${sessionId}`,
        initialDirectory: '/home/user'
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid action'
      })
    }
  } catch (error) {
    console.error('Terminal session error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Session management failed'
    })
  }
})

// Helper functions for simulation
async function simulateSQLExecution(query: string, capsuleId?: string) {
  // Simulate execution time
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

  const lowerQuery = query.toLowerCase().trim()

  // Simulate common SQL errors
  if (lowerQuery.includes('naem')) {
    return {
      success: false,
      error: 'ERROR: column "naem" does not exist\nHINT: Did you mean "name"?'
    }
  }

  if (lowerQuery.includes('drop') || lowerQuery.includes('delete') || lowerQuery.includes('truncate')) {
    return {
      success: false,
      error: 'ERROR: permission denied for destructive operations'
    }
  }

  // Simulate successful queries
  if (lowerQuery.includes('select')) {
    let mockResults = []
    
    if (lowerQuery.includes('products')) {
      mockResults = [
        { id: 1, name: 'Laptop', category: 'Electronics', price: 999.99 },
        { id: 2, name: 'Sofa', category: 'Furniture', price: 499.99 },
        { id: 3, name: 'Smartphone', category: 'Electronics', price: 699.99 },
        { id: 4, name: 'Desk', category: 'Furniture', price: 199.99 },
        { id: 5, name: 'Headphones', category: 'Electronics', price: 49.99 }
      ]
    } else if (lowerQuery.includes('users')) {
      mockResults = [
        { id: 1, name: 'Alice Johnson', email: 'alice@example.com', department: 'Engineering' },
        { id: 2, name: 'Bob Smith', email: 'bob@example.com', department: 'Sales' },
        { id: 3, name: 'Carol Davis', email: 'carol@example.com', department: 'Marketing' },
        { id: 4, name: 'David Wilson', email: 'david@example.com', department: 'Engineering' }
      ]
    } else if (lowerQuery.includes('orders')) {
      mockResults = [
        { id: 1, user_id: 1, amount: 299.99, created_at: '2024-11-10' },
        { id: 2, user_id: 2, amount: 149.50, created_at: '2024-11-10' },
        { id: 3, user_id: 1, amount: 89.99, created_at: '2024-11-11' }
      ]
    } else {
      mockResults = [
        { result: 'Query executed successfully', rows_affected: 0 }
      ]
    }

    // Apply basic filtering based on WHERE clauses
    if (lowerQuery.includes('category') && lowerQuery.includes('electronics')) {
      mockResults = mockResults.filter((row: any) => row.category === 'Electronics')
    } else if (lowerQuery.includes('department') && lowerQuery.includes('sales')) {
      mockResults = mockResults.filter((row: any) => row.department === 'Sales')
    }

    return {
      success: true,
      results: mockResults,
      executionTime: Math.floor(50 + Math.random() * 200)
    }
  }

  return {
    success: true,
    results: [{ message: 'Query executed successfully' }],
    executionTime: Math.floor(50 + Math.random() * 200)
  }
}

async function simulateTerminalExecution(command: string, sessionId?: string, capsuleId?: string) {
  // Simulate execution time
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300))

  const cmd = command.trim().toLowerCase()
  
  // Simulate common commands
  const outputs: Record<string, string> = {
    'pwd': '/home/user',
    'whoami': 'user',
    'date': new Date().toString(),
    'ls': 'Documents  Downloads  Pictures  test.txt',
    'ls -la': 'total 16\ndrwxr-xr-x 5 user user 4096 Nov 11 10:30 .\ndrwxr-xr-x 3 root root 4096 Nov 11 10:00 ..\n-rw-r--r-- 1 user user   13 Nov 11 10:30 test.txt\ndrwxr-xr-x 2 user user 4096 Nov 11 10:25 Documents',
    'cat test.txt': 'Hello, World!\nThis is a test file.',
    'uname -a': 'Linux terminal 5.4.0 #1 SMP Mon Nov 11 10:00:00 UTC 2024 x86_64 GNU/Linux'
  }

  if (cmd.startsWith('echo ')) {
    return {
      success: true,
      output: command.substring(5),
      exitCode: 0
    }
  }

  if (cmd.startsWith('touch ')) {
    const filename = command.substring(6).trim()
    return {
      success: true,
      output: ``,
      exitCode: 0,
      message: `Created file: ${filename}`
    }
  }

  if (cmd.startsWith('mkdir ')) {
    const dirname = command.substring(6).trim()
    return {
      success: true,
      output: ``,
      exitCode: 0,
      message: `Created directory: ${dirname}`
    }
  }

  if (outputs[cmd]) {
    return {
      success: true,
      output: outputs[cmd],
      exitCode: 0
    }
  }

  // Unknown command
  return {
    success: false,
    output: `bash: ${command}: command not found`,
    exitCode: 127
  }
}

async function simulateTaskValidation(capsuleId: string, sessionId?: string) {
  // Simulate validation time
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))

  // Mock task validation results
  const tasks = [
    { id: '1', description: 'Create a file called test.txt', completed: Math.random() > 0.3 },
    { id: '2', description: 'List the contents of the current directory', completed: Math.random() > 0.4 },
    { id: '3', description: 'Display the contents of test.txt', completed: Math.random() > 0.6 }
  ]

  const completedTasks = tasks.filter(task => task.completed).length
  const totalTasks = tasks.length

  return {
    success: true,
    tasks,
    completedTasks,
    totalTasks,
    progress: Math.round((completedTasks / totalTasks) * 100),
    allCompleted: completedTasks === totalTasks
  }
}

// Create HTTP server and WebSocket server
const server = createServer(app)
const wss = new WebSocketServer({ server })

// WebSocket handling for terminal sessions
const terminalSessions = new Map<string, WebSocket>()

wss.on('connection', (ws: WebSocket, req: any) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const sessionId = url.pathname.split('/').pop()

  if (sessionId && sessionId.startsWith('sess_')) {
    terminalSessions.set(sessionId, ws)
    console.log(`🔗 Terminal session connected: ${sessionId}`)

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'output',
      data: 'Welcome to Devcapsules Terminal!\r\nType "help" for available commands.\r\n'
    }))

    ws.on('message', async (message: string) => {
      try {
        const { type, data } = JSON.parse(message)
        
        if (type === 'input') {
          // Process terminal command
          const result = await simulateTerminalExecution(data.trim())
          
          // Send back the result
          ws.send(JSON.stringify({
            type: 'output',
            data: result.output + (result.output ? '\r\n' : '')
          }))
        }
      } catch (error) {
        console.error('WebSocket message error:', error)
        ws.send(JSON.stringify({
          type: 'error',
          data: 'Invalid message format\r\n'
        }))
      }
    })

    ws.on('close', () => {
      if (sessionId) {
        terminalSessions.delete(sessionId)
        console.log(`🔌 Terminal session disconnected: ${sessionId}`)
      }
    })
  } else {
    ws.close(4000, 'Invalid session ID')
  }
})

// Update Capsule Type Endpoint (for testing)
app.patch('/api/capsules/:id/type', async (req, res) => {
  try {
    const { id } = req.params
    const { type } = req.body

    if (!type || !['CODE', 'TERMINAL', 'DATABASE'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Valid type is required (CODE, TERMINAL, or DATABASE)'
      })
    }

    const updatedCapsule = await capsuleQueries.updateCapsule(id, { type })
    
    res.json({
      success: true,
      capsule: updatedCapsule
    })
  } catch (error) {
    console.error('Failed to update capsule type:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update capsule type'
    })
  }
})

// AI Mentor Hint Endpoint
app.post('/api/mentor/hint', async (req, res) => {
  try {
    const { user_id, capsule_id, test_case_id, submitted_code, error_signature } = req.body

    if (!submitted_code || !error_signature) {
      return res.status(400).json({
        success: false,
        error: 'Submitted code and error signature are required'
      })
    }

    const mentorRequest = {
      user_id: user_id || 'anonymous',
      capsule_id: capsule_id || 'unknown',
      test_case_id: test_case_id || 'unknown',
      submitted_code,
      error_signature,
      timestamp: new Date().toISOString()
    }

    const result = await handleMentorHintRequest(mentorRequest)
    res.json(result)
  } catch (error) {
    console.error('AI Mentor error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate mentor hint'
    })
  }
})

// ========== PLAYLIST ENDPOINTS ==========
// Course Management API for B2B Dashboard

// Get playlists for an organization (CourseCreatorDashboard)
app.get('/api/organizations/:organizationId/playlists', async (req, res) => {
  try {
    const { organizationId } = req.params
    
    // For now, treat organizationId as creatorId since we don't have org structure yet
    const playlists = await getPlaylistsByCreator(organizationId)
    
    // Transform to expected format with capsules
    const playlistsWithCapsules = await Promise.all(
      playlists.map(async (playlist) => {
        const playlistWithCapsules = await getPlaylistWithCapsules(playlist.playlist_id)
        return playlistWithCapsules || {
          playlist_id: playlist.playlist_id,
          creator_id: playlist.creator_id,
          title: playlist.title,
          description: playlist.description,
          is_public: playlist.is_public,
          created_at: playlist.created_at,
          updated_at: playlist.updated_at,
          items: []
        }
      })
    )
    
    res.json(playlistsWithCapsules)
  } catch (error) {
    console.error('Error fetching playlists:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch playlists'
    })
  }
})

// Get playlist analytics
app.get('/api/playlists/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params
    
    // Mock analytics data for now - replace with real analytics later
    const mockAnalytics = {
      total_enrollments: Math.floor(Math.random() * 100) + 10,
      completion_rate: Math.random() * 0.4 + 0.6, // 60-100%
      average_time_minutes: Math.floor(Math.random() * 30) + 15,
      engagement_score: Math.random() * 2 + 3, // 3-5 stars
      last_activity: new Date().toISOString()
    }
    
    res.json(mockAnalytics)
  } catch (error) {
    console.error('Error fetching playlist analytics:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics'
    })
  }
})

// Duplicate playlist
app.post('/api/playlists/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params
    const { title } = req.body
    
    // Get the original playlist
    const originalPlaylist = await getPlaylistWithCapsules(id)
    if (!originalPlaylist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found'
      })
    }
    
    // Create new playlist with same content
    const newPlaylist = await createPlaylist({
      creator_id: originalPlaylist.creator_id,
      title: title || `${originalPlaylist.title} (Copy)`,
      description: originalPlaylist.description,
      is_public: false, // Copies are private by default
      items: [] // Start with empty items array
    })
    
    // TODO: Copy the playlist items/capsules as well
    // For now, just return the empty playlist
    
    res.json({
      success: true,
      playlist: newPlaylist
    })
  } catch (error) {
    console.error('Error duplicating playlist:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate playlist'
    })
  }
})

// Publish playlist
app.post('/api/playlists/:id/publish', async (req, res) => {
  try {
    const { id } = req.params
    
    // Update playlist to be public
    const updatedPlaylist = await updatePlaylist(id, {
      is_public: true
    })
    
    res.json({
      success: true,
      playlist: updatedPlaylist
    })
  } catch (error) {
    console.error('Error publishing playlist:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish playlist'
    })
  }
})

// Delete playlist
app.delete('/api/playlists/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // For now, just mark as archived instead of hard delete
    const updatedPlaylist = await updatePlaylist(id, {
      is_public: false
    })
    
    res.json({
      success: true,
      message: 'Playlist archived successfully'
    })
  } catch (error) {
    console.error('Error deleting playlist:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete playlist'
    })
  }
})

// Get specific playlist (for PlaylistEditor)
app.get('/api/playlists/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const playlist = await getPlaylistWithCapsules(id)
    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found'
      })
    }
    
    res.json(playlist)
  } catch (error) {
    console.error('Error fetching playlist:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch playlist'
    })
  }
})

// Create new playlist (for PlaylistEditor)
app.post('/api/organizations/:organizationId/playlists', async (req, res) => {
  try {
    const { organizationId } = req.params
    const { title, description, is_public } = req.body
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      })
    }
    
    const playlist = await createPlaylist({
      creator_id: organizationId, // Use organizationId as creator for now
      title,
      description: description || '',
      is_public: is_public || false,
      items: [] // Start with empty playlist
    })
    
    res.json({
      success: true,
      playlist
    })
  } catch (error) {
    console.error('Error creating playlist:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create playlist'
    })
  }
})

// Get capsules for organization (for PlaylistEditor)
app.get('/api/organizations/:organizationId/capsules', async (req, res) => {
  try {
    const { organizationId } = req.params
    
    // For now, get all capsules from the user (treat organizationId as userId)
    const capsules = await capsuleQueries.getUserCapsules(organizationId)
    
    res.json(capsules)
  } catch (error) {
    console.error('Error fetching organization capsules:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch capsules'
    })
  }
})

// AI capsule generation (for PlaylistEditor)
app.post('/api/ai/generate-capsule', async (req, res) => {
  try {
    const { prompt, language, difficulty, context } = req.body
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      })
    }
    
    // Use the existing generation pipeline - for now return mock response
    // TODO: Integrate with actual AI generation when pipeline is configured
    const mockCapsule = {
      id: `generated-${Date.now()}`,
      title: `Generated: ${prompt.substring(0, 50)}...`,
      description: `Auto-generated capsule based on: ${prompt}`,
      capsule_type: 'CODE' as const,
      language: language || 'python',
      difficulty: difficulty || 'beginner',
      config_data: {
        code: {
          solution: `# Generated code for: ${prompt}\nprint("Hello, World!")`,
          starter: `# Your code here\npass`,
          explanation: `This capsule was generated based on: ${prompt}`
        },
        test_cases: [{
          description: 'Basic test',
          test_call: 'print("Hello, World!")',
          expected_output: 'Hello, World!'
        }]
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    res.json({
      success: true,
      capsule: mockCapsule
    })
  } catch (error) {
    console.error('Error generating capsule:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate capsule'
    })
  }
})

// Delete capsule endpoint
app.delete('/api/capsules/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if capsule exists
    const existingCapsule = await capsuleQueries.getCapsuleById(id)
    if (!existingCapsule) {
      return res.status(404).json({
        success: false,
        error: 'Capsule not found'
      })
    }
    
    // Delete the capsule - this will use the existing delete logic in queries
    await capsuleQueries.deleteCapsule(id)
    
    res.json({
      success: true,
      message: 'Capsule deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting capsule:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete capsule'
    })
  }
})

// ========== B2B ANALYTICS ENDPOINTS ==========
// Strategic Data Collection for Your Analytics Moat

// High-throughput event ingestion endpoint
app.post('/api/analytics/track', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body]
    console.log(`📊 Tracking ${events.length} analytics events`)
    
    for (const event of events) {
      // Add server-side metadata
      const enrichedEvent = {
        ...event,
        timestamp: event.timestamp || Date.now(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      }
      
      // Track event using EventTracker interface
      eventTracker.track(
        event.event_type || event.action, 
        event.user_id || 'anonymous', 
        {
          ...event.data,
          ...event.metadata,
          timestamp: enrichedEvent.timestamp,
          ip_address: enrichedEvent.ip_address,
          user_agent: enrichedEvent.user_agent
        },
        event.capsule_id
      )
    }
    
    res.json({ 
      success: true, 
      events_tracked: events.length,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('📊 Event tracking error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Event tracking failed'
    })
  }
})

// Pro Tier Dashboard - Content Engagement Metrics
app.get('/api/analytics/engagement/:capsuleId', async (req, res) => {
  try {
    const { capsuleId } = req.params
    const { days = 30 } = req.query
    
    // Mock data for now - replace with real analytics collector
    const mockMetrics = {
      capsule_id: capsuleId,
      time_range: { start: new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000), end: new Date() },
      impressions: 2840,
      engagement_rate: 68.7, // (1950/2840) * 100
      completion_rate: 67.2,  // (1310/1950) * 100
      funnel: {
        impressions: 2840,
        runs: 1950,
        completions: 1310,
        drop_off_at_run: 31.3,
        drop_off_at_completion: 32.8
      },
      avg_time_to_first_run: 32,
      avg_session_duration: 185,
      return_user_rate: 23.4
    }
    
    res.json({
      success: true,
      metrics: mockMetrics,
      tier: 'pro'
    })
  } catch (error) {
    console.error('📊 Engagement metrics error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engagement metrics'
    })
  }
})

// B2B Tier Dashboard - Pedagogical Intelligence
app.get('/api/analytics/pedagogical/:capsuleId', async (req, res) => {
  try {
    const { capsuleId } = req.params
    const { cohortId, days = 30 } = req.query
    
    // Mock pedagogical data - replace with real analytics
    const mockMetrics = {
      capsule_id: capsuleId,
      cohort_id: cohortId,
      time_range: { start: new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000), end: new Date() },
      student_count: 45,
      avg_run_to_pass_ratio: 5.4,
      avg_time_to_first_run: 32,
      at_risk_students: [
        { user_id: 'student_123', student_name: 'John Doe', run_to_pass_ratio: 12.3, stuck_test_cases: ['edge_case_negative_numbers'], time_since_last_attempt: 18, needs_help_score: 85 },
        { user_id: 'student_456', student_name: 'Jane Smith', run_to_pass_ratio: 9.7, stuck_test_cases: ['handles_empty_array'], time_since_last_attempt: 6, needs_help_score: 78 }
      ],
      failing_test_cases: [
        { test_case_id: 'test_001', test_case_name: 'edge_case_negative_numbers', failure_rate: 78.2, student_count: 35, common_errors: [{ error_type: 'IndexError', error_message: 'list index out of range', frequency: 28, example_code: 'nums[i]' }] },
        { test_case_id: 'test_002', test_case_name: 'handles_empty_array', failure_rate: 62.1, student_count: 28, common_errors: [{ error_type: 'ValueError', error_message: 'empty array', frequency: 19, example_code: 'max([])' }] }
      ]
    }
    
    res.json({
      success: true,
      metrics: mockMetrics,
      tier: 'b2b'
    })
  } catch (error) {
    console.error('📊 Pedagogical metrics error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pedagogical metrics'
    })
  }
})

// The "Money Shot" - Top Failing Test Cases
app.get('/api/analytics/failing-tests/:capsuleId', async (req, res) => {
  try {
    const { capsuleId } = req.params
    const { limit = 10 } = req.query
    
    const failingTests = [
      { test_case_name: 'handles_empty_list_exception', failure_rate: 78.2, student_count: 35, insight: 'Students not checking for empty arrays before processing' },
      { test_case_name: 'handles_sql_join_on_null', failure_rate: 62.1, student_count: 28, insight: 'NULL handling in SQL joins is confusing students' },
      { test_case_name: 'handles_positive_numbers', failure_rate: 5.3, student_count: 2, insight: 'Basic case - most students understand' }
    ]
    
    res.json({
      success: true,
      failing_tests: failingTests.slice(0, parseInt(limit as string)),
      insight: 'These are the exact topics to re-teach in tomorrow\'s lecture',
      capsule_id: capsuleId
    })
  } catch (error) {
    console.error('📊 Failing tests analysis error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to analyze failing tests'
    })
  }
})

// At-Risk Students Alert System
app.get('/api/analytics/at-risk-students/:cohortId', async (req, res) => {
  try {
    const { cohortId } = req.params
    const { threshold = 5.0 } = req.query
    
    const atRiskStudents = [
      { user_id: 'student_123', student_name: 'John Doe', run_to_pass_ratio: 12.3, stuck_test_cases: ['edge_case_negative_numbers', 'handles_null_input'], time_since_last_attempt: 18, needs_help_score: 85 },
      { user_id: 'student_456', student_name: 'Jane Smith', run_to_pass_ratio: 9.7, stuck_test_cases: ['recursive_solution'], time_since_last_attempt: 6, needs_help_score: 78 },
      { user_id: 'student_789', student_name: 'Bob Wilson', run_to_pass_ratio: 7.8, stuck_test_cases: ['optimization_check'], time_since_last_attempt: 12, needs_help_score: 72 }
    ].filter(student => student.run_to_pass_ratio >= parseFloat(threshold as string))
    
    res.json({
      success: true,
      at_risk_students: atRiskStudents,
      recommendation: 'These students need immediate instructor attention',
      cohort_id: cohortId,
      threshold_used: parseFloat(threshold as string)
    })
  } catch (error) {
    console.error('📊 At-risk students analysis error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to identify at-risk students'
    })
  }
})

// Quality Metrics Endpoint
app.get('/api/analytics/quality/:capsuleId', async (req, res) => {
  try {
    const { capsuleId } = req.params
    const metrics = await analyticsCollector.getCapsuleMetrics(capsuleId)
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'No metrics found for this capsule'
      })
    }
    
    res.json({
      success: true,
      metrics
    })
  } catch (error) {
    console.error('Quality metrics error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get quality metrics'
    })
  }
})

// Feedback Processing Endpoint
app.post('/api/feedback/process', async (req, res) => {
  try {
    const { capsule_id, improvement_suggestions } = req.body

    if (!capsule_id) {
      return res.status(400).json({
        success: false,
        error: 'Capsule ID is required'
      })
    }

    await feedbackProcessor.processSuggestions(improvement_suggestions || [])
    
    res.json({
      success: true,
      message: 'Feedback processing initiated'
    })
  } catch (error) {
    console.error('Feedback processing error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process feedback'
    })
  }
})

// Quality Improvement Analysis Endpoint
app.post('/api/analytics/analyze', async (req, res) => {
  try {
    // Create required thresholds for the QualityMetrics constructor
    const thresholds = {
      min_completion_rate: 0.7,
      max_abandonment_rate: 0.3,
      min_success_rate: 0.8,
      max_average_time_minutes: 30,
      max_error_frequency: 0.2,
      min_satisfaction_score: 4.0
    }

    const qualityAnalyzer = new QualityMetrics(analyticsCollector, thresholds)
    const suggestions = await qualityAnalyzer.generateImprovementSuggestions()
    
    res.json({
      success: true,
      suggestions,
      count: suggestions.length
    })
  } catch (error) {
    console.error('Quality analysis error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze quality'
    })
  }
})

// Global error handler to ensure CORS headers are sent on errors
app.use((err: any, req: any, res: any, next: any) => {
  console.error('🚨 Unhandled error:', err)
  
  // Ensure CORS headers are set
  const origin = req.headers.origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: Date.now()
  })
})

// Start server
server.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
  console.log(`🤖 AI Test: http://localhost:${PORT}/api/test-ai`)
  console.log(`📝 Generate: POST http://localhost:${PORT}/api/generate`)
  console.log(`🧪 Validate: POST http://localhost:${PORT}/api/capsules/validate`)
  console.log(`🚀 Publish: POST http://localhost:${PORT}/api/capsules/publish`)
  console.log(`📋 My Capsules: GET http://localhost:${PORT}/api/my-capsules`)
  console.log(`🖥️  SQL Execute: POST http://localhost:${PORT}/api/sql/execute`)
  console.log(`🔧 Terminal Execute: POST http://localhost:${PORT}/api/terminal/execute`)
  console.log(`✅ Task Validation: POST http://localhost:${PORT}/api/terminal/validate`)
  console.log(`🔌 WebSocket Terminal: ws://localhost:${PORT}/terminal/{sessionId}`)
  
  console.log('\n🧠 AI & Analytics Endpoints:')
  console.log(`🎯 AI Mentor Hints: POST http://localhost:${PORT}/api/mentor/hint`)
  console.log(`📊 Track Events: POST http://localhost:${PORT}/api/analytics/track`)
  console.log(`📈 Quality Metrics: GET http://localhost:${PORT}/api/analytics/quality/{capsuleId}`)
  console.log(`🔄 Process Feedback: POST http://localhost:${PORT}/api/feedback/process`)
  console.log(`🧪 Test Execution: POST http://localhost:${PORT}/api/execute-tests`)
  console.log(`🔍 Quality Analysis: POST http://localhost:${PORT}/api/analytics/analyze`)
  
  console.log('\n💰 B2B Analytics Endpoints (Your Data Moat):')
  console.log(`📈 Pro Tier - Engagement: GET http://localhost:${PORT}/api/analytics/engagement/{capsuleId}`)
  console.log(`🎓 B2B Tier - Pedagogical: GET http://localhost:${PORT}/api/analytics/pedagogical/{capsuleId}`)
  console.log(`❌ Failing Test Cases: GET http://localhost:${PORT}/api/analytics/failing-tests/{capsuleId}`)
  console.log(`🚨 At-Risk Students: GET http://localhost:${PORT}/api/analytics/at-risk-students/{cohortId}`)
  
  if (!process.env.AZURE_OPENAI_API_KEY) {
    console.warn('⚠️  AZURE_OPENAI_API_KEY not set - using mock AI responses')
  }
})

export default app