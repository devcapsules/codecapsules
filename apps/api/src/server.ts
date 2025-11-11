import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
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

// Load environment variables from the API package directory
const envPath = path.join(__dirname, '../.env')
dotenv.config({ path: envPath })

console.log('🔧 Environment check:')
console.log('   AZURE_OPENAI_API_KEY:', process.env.AZURE_OPENAI_API_KEY ? '✅ Set' : '❌ Missing')
console.log('   AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT ? '✅ Set' : '❌ Missing')
console.log('   AWS_LAMBDA_URL:', process.env.AWS_LAMBDA_URL ? '✅ AWS Lambda (Production)' : '⚠️  Local Development')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Initialize unified AI generation engine
const generationEngine = createGenerationEngine()

// Initialize serverless execution engine with production configuration
const executionEngine = new ServerlessExecutionEngine(
  process.env.AWS_LAMBDA_URL,
  process.env.USE_LOCAL_EXECUTION_FALLBACK === 'true'
)

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    ai_service: process.env.AZURE_OPENAI_API_KEY ? 'connected' : 'mock',
    execution_mode: process.env.AWS_LAMBDA_URL ? 'serverless' : 'local',
    aws_gateway: process.env.AWS_LAMBDA_URL || 'not_configured',
    supported_languages: executionEngine.getSupportedLanguages()
  })
})

// Main generation endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { 
      prompt, 
      type = 'code', 
      difficulty = 'medium', 
      runtime = 'wasm',
      language = 'javascript'
    } = req.body

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

    const result: GenerationResult = await generationEngine.generateCapsule(config)

    res.json({
      success: true,
      capsule: result.capsule,
      metadata: result.generationMetadata,
      qualityScore: result.qualityScore,
      suggestions: result.suggestions
    })

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

    const result = await generationEngine.generateCapsule(config)

    res.json({
      success: true,
      title: result.capsule.title,
      description: result.capsule.description,
      content: result.capsule.content,
      runtime: result.capsule.runtime,
      qualityScore: result.qualityScore
    })

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

    const result = await executionEngine.executeCode(
      source_code,
      language,
      input,
      time_limit,
      memory_limit
    )

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

// Combined generation + execution endpoint
app.post('/api/generate-and-execute', async (req, res) => {
  try {
    const {
      prompt,
      language = 'javascript',
      difficulty = 'medium',
      input = '',
      archetype = 'generated'
    } = req.body

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

    // Step 1: Generate code using AI
    const config: GenerationConfig = {
      prompt,
      capsuleType: 'code',
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

    const generationResult = await generationEngine.generateCapsule(config)
    
    // Step 1.5: Save generated capsule to database
    let savedCapsule = null
    try {
      // Create or get a default user for now (in production, use auth)
      const defaultUser = await userQueries.findOrCreateUser(
        'default-user', 
        'default@codecapsule.com', 
        'Default User'
      )
      
      // Map generation result to database format
      const capsuleData = {
        title: generationResult.capsule.title,
        description: generationResult.capsule.description,
        type: 'CODE' as const,
        difficulty: (difficulty?.toUpperCase() || 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD',
        language: language,
        tags: [archetype || 'generated'],
        content: generationResult.capsule.content,
        runtime: generationResult.capsule.runtime,
        pedagogy: generationResult.capsule.pedagogy,
        business: generationResult.capsule.business,
        creatorId: defaultUser.id
      }
      
      savedCapsule = await capsuleQueries.createCapsule(capsuleData)
      console.log(`💾 Saved capsule to database: ${savedCapsule.id}`)
      
    } catch (dbError) {
      console.error('⚠️ Database save failed (continuing without save):', dbError)
      // Continue execution even if database save fails
    }
    
    // Step 2: Execute the generated code
    let codeToExecute = ''
    
    // Extract code from the adaptive content structure with fallbacks
    const primaryContent = generationResult.capsule.content.primary
    
    console.log(`🔍 Looking for executable code in capsule structure...`)
    console.log(`🔍 Primary content keys:`, Object.keys(primaryContent || {}))
    console.log(`🔍 Code structure:`, primaryContent.code ? Object.keys(primaryContent.code) : 'No code object')
    
    // Try multiple paths to find executable code
    if (primaryContent.code?.wasmVersion?.solution) {
      codeToExecute = primaryContent.code.wasmVersion.solution
      console.log(`✅ Found solution code: ${codeToExecute.substring(0, 100)}...`)
    } else if (primaryContent.code?.wasmVersion?.starterCode) {
      codeToExecute = primaryContent.code.wasmVersion.starterCode
      console.log(`✅ Found starter code: ${codeToExecute.substring(0, 100)}...`)
    } else if (primaryContent.code?.dockerVersion?.projectStructure?.[0]?.content) {
      codeToExecute = primaryContent.code.dockerVersion.projectStructure[0].content
      console.log(`✅ Found Docker project code: ${codeToExecute.substring(0, 100)}...`)
    } else {
      // Log the full structure for debugging
      console.error(`❌ No executable code found. Full capsule structure:`, JSON.stringify(generationResult.capsule, null, 2).substring(0, 1000))
      throw new Error('No executable code found in generated capsule')
    }

    const executionResult = await executionEngine.executeCode(
      codeToExecute,
      language as SupportedLanguage,
      input,
      10, // 10 second timeout
      256 // 256MB memory limit
    )

    res.json({
      success: true,
      generation: {
        title: generationResult.capsule.title,
        description: generationResult.capsule.description,
        code: codeToExecute,
        fullCapsule: generationResult.capsule, // Include complete capsule data
        qualityScore: generationResult.qualityScore,
        tokensUsed: generationResult.generationMetadata.tokensUsed,
        savedCapsuleId: savedCapsule?.id // Include database ID if saved
      },
      execution: {
        success: executionResult.success,
        stdout: executionResult.stdout,
        stderr: executionResult.stderr,
        exit_code: executionResult.exit_code,
        execution_time: executionResult.execution_time,
        memory_used: executionResult.memory_used,
        error: executionResult.error
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
      capsules: capsules.map(capsule => ({
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
      'default@codecapsule.com', 
      'Default User'
    )
    
    // Get all capsules for this user (published and unpublished)
    const capsules = await capsuleQueries.getUserCapsules(defaultUser.id)
    
    res.json({
      success: true,
      capsules: capsules.map(capsule => ({
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

// Update capsule endpoint
app.put('/api/capsules/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, content, runtime, pedagogy, isPublished } = req.body
    
    // Validate that at least one field is provided
    if (!title && !description && !content && !runtime && !pedagogy && isPublished === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for update'
      })
    }
    
    console.log(`📝 Updating capsule ${id}:`, { 
      title: title || 'unchanged',
      hasContent: !!content,
      isPublished
    })
    
    const updatedCapsule = await capsuleQueries.updateCapsule(id, {
      title,
      description,
      content,
      runtime,
      pedagogy,
      isPublished
    })
    
    console.log('✅ Capsule updated successfully:', updatedCapsule.title)
    
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

// Widget/Embed endpoints
app.get('/api/widgets/:id', async (req, res) => {
  try {
    const { id } = req.params
    
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
    
    res.json({
      success: true,
      widget
    })
  } catch (error) {
    console.error('Failed to fetch widget:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch widget',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
  console.log(`🤖 AI Test: http://localhost:${PORT}/api/test-ai`)
  console.log(`📝 Generate: POST http://localhost:${PORT}/api/generate`)
  
  if (!process.env.AZURE_OPENAI_API_KEY) {
    console.warn('⚠️  AZURE_OPENAI_API_KEY not set - using mock AI responses')
  }
})

export default app