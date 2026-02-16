// LEGACY API FILE - DEPRECATED
// This file contains complex legacy code that needs refactoring
// The working, integrated API is in server.ts

export * from './server'

console.warn('⚠️  WARNING: index.ts is deprecated. Use server.ts for the integrated Devcapsules API with analytics.')

// Rest of file disabled due to legacy issues - use server.ts
/* 
Legacy code commented out - contains many broken functions
Use server.ts for the working integrated API

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/widgets/:widgetId', (req, res) => {
  const { widgetId } = req.params
  // TODO: Implement widget fetching logic
  res.json({ 
    widgetId, 
    status: 'placeholder',
    message: 'Widget API endpoint - to be implemented' 
  })
})

// Initialize unified AI generation engine
const generationEngine = createGenerationEngine()

// Helper functions for review-specific operations
async function handleSectionRegeneration(req: any, res: any, params: {
  type: string,
  section: string,
  existingContent: any,
  difficulty: string,
  language: string,
  runtime: string
}) {
  try {
    const { type, section, existingContent, difficulty, language, runtime } = params
    
    // Create a targeted prompt for section regeneration
    const sectionPrompt = createSectionRegenerationPrompt(type, section, existingContent)
    
    // Generate new content for the specific section using the generation engine
    const config: GenerationConfig = {
      prompt: sectionPrompt,
      capsuleType: type as CapsuleType,
      difficulty: difficulty as any,
      runtimeTarget: runtime as RuntimeTarget,
      constraints: {} as any,
      aiModel: 'gpt-4o',
      useCreatorFeedback: false,
      qualityThreshold: 0.7,
      maxRegenerationAttempts: 3
    }
    
    let result = await generationEngine.generateCapsule(config)
    
    // Merge the regenerated section with existing content
    const updatedContent = mergeSectionWithExistingContent(existingContent, section, result.capsule)
    
    res.json({
      success: true,
      content: updatedContent,
      regeneratedSection: section,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Section regeneration error:', error)
    res.status(500).json({ 
      error: 'Failed to regenerate section',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleSectionRefinement(req: any, res: any, params: {
  type: string,
  section: string,
  refinementPrompt: string,
  existingContent: any,
  difficulty: string,
  language: string,
  runtime: string
}) {
  try {
    const { type, section, refinementPrompt, existingContent, difficulty, language, runtime } = params
    
    // Create a refinement prompt for the specific section
    const refinedPrompt = createSectionRefinementPrompt(type, section, existingContent, refinementPrompt)
    
    // Generate refined content
    const context = createGenerationContext(type, refinedPrompt, difficulty, runtime, language)
    let result = await generateContentByType(type, context)
    
    // Merge the refined section with existing content
    const updatedContent = mergeSectionWithExistingContent(existingContent, section, result.content)
    
    res.json({
      success: true,
      content: updatedContent,
      refinedSection: section,
      refinementApplied: refinementPrompt,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Section refinement error:', error)
    res.status(500).json({ 
      error: 'Failed to refine section',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function createSectionRegenerationPrompt(type: string, section: string, existingContent: any): string {
  const basePrompt = `Regenerate the ${section} section for a ${type} learning exercise.`
  
  switch (section) {
    case 'problem':
      return `${basePrompt} Create a clear, engaging problem statement that explains what learners need to accomplish. Current title: "${existingContent.title}"`
    case 'code':
      return `${basePrompt} Generate better starter code that provides the right scaffolding without giving away the solution.`
    case 'solution':
      return `${basePrompt} Create an improved solution with better code organization and clearer explanations.`
    case 'tests':
      return `${basePrompt} Generate comprehensive test cases including edge cases and clear descriptions.`
    default:
      return `${basePrompt} Improve the ${section} section based on best practices.`
  }
}

function createSectionRefinementPrompt(type: string, section: string, existingContent: any, refinementPrompt: string): string {
  const basePrompt = `Refine the ${section} section for a ${type} learning exercise based on this feedback: "${refinementPrompt}".`
  
  switch (section) {
    case 'problem':
      return `${basePrompt} Current problem: "${existingContent.description || existingContent.title}"`
    case 'code':
      return `${basePrompt} Current code: \n${existingContent.starterCode || ''}`
    case 'solution':
      return `${basePrompt} Current solution: \n${existingContent.solutionCode || ''}`
    case 'tests':
      return `${basePrompt} Current tests: ${JSON.stringify(existingContent.testCases || [])}`
    default:
      return `${basePrompt} Please apply the refinement to improve this section.`
  }
}

function createGenerationContext(type: string, prompt: string, difficulty: string, runtime: string, language: string) {
  const constraints = runtime === 'wasm' ? {
    target: 'wasm' as const,
    wasmLimitations: {
      noFileSystem: true,
      noNetworking: true,
      memoryLimit: parseInt(process.env.WASM_MEMORY_LIMIT_MB || '64'),
      executionTimeLimit: parseInt(process.env.WASM_EXECUTION_TIMEOUT_MS || '5000'),
      allowedLanguages: [language],
      maxCodeComplexity: difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 5 : 7
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
  }

  return {
    type: type as CapsuleType,
    userPrompt: prompt,
    runtimeTarget: runtime as RuntimeTarget,
    constraints,
    difficulty: difficulty as DifficultyLevel,
    creatorFeedback: []
  }
}

async function generateContentByType(type: string, prompt: string, difficulty: string, runtime: string) {
  const config: GenerationConfig = {
    prompt,
    capsuleType: type as CapsuleType,
    difficulty: (difficulty === 'beginner' ? 'easy' : difficulty === 'intermediate' ? 'medium' : 'hard') as 'easy' | 'medium' | 'hard',
    runtimeTarget: runtime as RuntimeTarget,
    constraints: runtime === 'wasm' ? {
      target: 'wasm' as const,
      wasmLimitations: {
        noFileSystem: true,
        noNetworking: true,
        memoryLimit: 128,
        executionTimeLimit: 5000,
        allowedLanguages: ['javascript', 'python'],
        maxCodeComplexity: difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 5 : 7
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
    maxRegenerationAttempts: 3
  }
  
  return await generationEngine.generateCapsule(config)
}

function mergeSectionWithExistingContent(existingContent: any, section: string, newContent: any): any {
  const merged = { ...existingContent }
  
  switch (section) {
    case 'problem':
      merged.title = newContent.title || merged.title
      merged.description = newContent.description || merged.description
      merged.concepts = newContent.concepts || merged.concepts
      break
    case 'code':
      merged.starterCode = newContent.starterCode || merged.starterCode
      break
    case 'solution':
      merged.solutionCode = newContent.solutionCode || merged.solutionCode
      merged.hints = newContent.hints || merged.hints
      break
    case 'tests':
      merged.testCases = newContent.testCases || merged.testCases
      break
    default:
      // For unknown sections, merge all properties
      Object.assign(merged, newContent)
  }
  
  return merged
}

// AI Content Generation Endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { 
      type, 
      prompt, 
      difficulty = 'intermediate', 
      runtime = 'wasm',
      language = 'javascript',
      regenerateSection,
      refineSection,
      refinementPrompt,
      existingContent
    } = req.body

    // Validate input
    if (!type) {
      return res.status(400).json({ 
        error: 'Missing required field: type' 
      })
    }

    // Handle section-specific regeneration
    if (regenerateSection) {
      return await handleSectionRegeneration(req, res, {
        type,
        section: regenerateSection,
        existingContent,
        difficulty,
        language,
        runtime
      })
    }

    // Handle refinement with prompt
    if (refineSection && refinementPrompt) {
      return await handleSectionRefinement(req, res, {
        type,
        section: refineSection,
        refinementPrompt,
        existingContent,
        difficulty,
        language,
        runtime
      })
    }

    // Validate required fields for full generation
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required field: prompt' 
      })
    }

    // Prepare generation context
    const context = createGenerationContext(type, prompt, difficulty, runtime, language)

    // Generate content based on type
    const result = await generateContentByType(type, context)

    // Assess quality
    const qualityContext = {
      content: result.content,
      capsuleType: type as CapsuleType,
      difficulty: difficulty as DifficultyLevel,
      runtimeTarget: runtime as RuntimeTarget,
      constraints: context.constraints,
      userPrompt: prompt,
      qualityThreshold: 75
    }

    const qualityReport = await qualityPipeline.assessQuality(qualityContext)

    res.json({
      success: true,
      content: result.content,
      metadata: result.typeSpecificMetadata,
      validation: result.validationResults,
      quality: {
        score: qualityReport.metrics.overallScore,
        issues: qualityReport.issues.length,
        recommendations: qualityReport.recommendations,
        passesThreshold: qualityReport.passesThreshold
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Generation error:', error)
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Quality Assessment Endpoint
app.post('/api/assess-quality', async (req, res) => {
  try {
    const { content, type, difficulty = 'intermediate', runtime = 'wasm' } = req.body

    if (!content || !type) {
      return res.status(400).json({ error: 'Missing required fields: content, type' })
    }

    const constraints = runtime === 'wasm' ? {
      target: 'wasm' as const,
      wasmLimitations: {
        noFileSystem: true,
        noNetworking: true,
        memoryLimit: 64,
        executionTimeLimit: 5000,
        allowedLanguages: ['javascript'],
        maxCodeComplexity: 5
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
    }

    const qualityContext = {
      content,
      capsuleType: type as CapsuleType,
      difficulty: difficulty as DifficultyLevel,
      runtimeTarget: runtime as RuntimeTarget,
      constraints,
      userPrompt: 'Quality assessment request',
      qualityThreshold: 75
    }

    const report = await qualityPipeline.assessQuality(qualityContext)

    res.json({
      success: true,
      quality: {
        metrics: report.metrics,
        issues: report.issues,
        recommendations: report.recommendations,
        passesThreshold: report.passesThreshold
      },
      assessedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Quality assessment error:', error)
    res.status(500).json({ 
      error: 'Failed to assess quality',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.post('/api/widgets', (req, res) => {
  // TODO: Implement widget creation logic
  res.json({ 
    message: 'Widget creation endpoint - to be implemented',
    body: req.body 
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Devcapsules API server running on port ${PORT}`)
})
*/