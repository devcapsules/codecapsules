/**
 * AI Generation Engine - Core Orchestration System
 * 
 * Powered by Azure OpenAI GPT-4o
 * 
 * This is the heart of your content generation system that transforms
 * user prompts into high-quality learning capsules with:
 * - Runtime awareness (WASM vs Docker)
 * - Pedagogical intelligence 
 * - Creator feedback integration
 * - Quality assurance
 */

// Import AI service for Azure OpenAI integration
import { AIService, tryCreateAIService, type AIMessage } from '../services/ai-service';

import type { 
  UniversalCapsule
} from '../types/universal-capsule';

import type { 
  RuntimeTarget,
  RuntimeConstraints
} from '../types/runtime-aware';

import type { 
  CapsuleType
} from '../types/capsule';

import { CreatorFeedbackCapture, type AIToHumanEdit } from '../types/creator-feedback';

// ===== CONFIGURATION =====

export interface GenerationConfig {
  // User input
  prompt: string;
  capsuleType: CapsuleType;
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Runtime targeting (your cost moat)
  runtimeTarget: RuntimeTarget;
  constraints: RuntimeConstraints;
  
  // Language constraints
  allowedLanguages?: string[];
  
  // Pedagogical settings
  learningObjectives?: string[];
  targetAudience?: string;
  estimatedTime?: number; // minutes
  
  // AI settings
  aiModel: 'gpt-4o' | 'gpt-4-turbo';
  temperature?: number;
  maxTokens?: number;
  
  // Quality settings
  useCreatorFeedback: boolean;
  qualityThreshold: number; // 0-1
  maxRegenerationAttempts: number;
}

export interface GenerationResult {
  capsule: UniversalCapsule;
  generationMetadata: GenerationMetadata;
  qualityScore: number;
  suggestions: string[];
}

export interface GenerationMetadata {
  generationId: string;
  timestamp: Date;
  modelUsed: string;
  tokensUsed: number;
  generationTime: number; // milliseconds
  attempts: number;
  promptVersion: string;
  feedbackUsed: AIToHumanEdit[];
}

// ===== CORE GENERATION ENGINE =====

export class CapsuleGenerationEngine {
  
  private aiService?: AIService;
  private feedbackSystem: typeof CreatorFeedbackCapture;
  
  constructor(
    aiService?: AIService,
    feedbackSystem?: typeof CreatorFeedbackCapture
  ) {
    this.aiService = aiService;
    this.feedbackSystem = feedbackSystem || CreatorFeedbackCapture;
  }
  
  /**
   * Generate a complete capsule from user input
   * This is the main entry point for content generation
   */
  async generateCapsule(config: GenerationConfig): Promise<GenerationResult> {
    const startTime = Date.now();
    const generationId = this.generateId();
    
    console.log(`🚀 Starting capsule generation [${generationId}]`);
    console.log(`📋 Config: ${config.capsuleType} | ${config.runtimeTarget} | ${config.difficulty}`);
    
    try {
      // 1. Prepare generation context
      const context = await this.prepareGenerationContext(config);
      
      // 2. Generate content with quality loop
      const capsule = await this.generateWithQualityLoop(config, context);
      
      // 3. Post-process and validate
      const finalCapsule = await this.postProcessCapsule(capsule, config);
      
      // 4. Calculate quality score
      const qualityScore = await this.assessQuality(finalCapsule, config);
      
      // 5. Generate suggestions
      const suggestions = await this.generateSuggestions(finalCapsule, config);
      
      const generationTime = Date.now() - startTime;
      
      console.log(`✅ Generation complete [${generationId}] in ${generationTime}ms`);
      console.log(`📊 Quality score: ${qualityScore.toFixed(2)}`);
      
      return {
        capsule: finalCapsule,
        generationMetadata: {
          generationId,
          timestamp: new Date(),
          modelUsed: config.aiModel,
          tokensUsed: context.tokensUsed,
          generationTime,
          attempts: context.attempts,
          promptVersion: context.promptVersion,
          feedbackUsed: context.feedbackUsed
        },
        qualityScore,
        suggestions
      };
      
    } catch (error) {
      console.error(`❌ Generation failed [${generationId}]:`, error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new GenerationError(`Generation failed: ${message}`, generationId);
    }
  }
  
  /**
   * Prepare generation context with runtime awareness and feedback data
   */
  private async prepareGenerationContext(config: GenerationConfig): Promise<GenerationContext> {
    console.log(`🔍 Preparing generation context...`);
    
    // Get relevant creator feedback for this type of generation
    const relevantFeedback = config.useCreatorFeedback ? 
      await this.getRelevantCreatorFeedback(config) : [];
    
    // Build runtime-aware prompt
    const runtimePrompt = this.buildRuntimeAwarePrompt(config);
    
    // Get pedagogical constraints
    const pedagogicalConstraints = this.getPedagogicalConstraints(config);
    
    // Build system prompt with all context
    const systemPrompt = this.buildSystemPrompt(
      config, 
      runtimePrompt, 
      pedagogicalConstraints, 
      relevantFeedback
    );
    
    return {
      systemPrompt,
      userPrompt: config.prompt,
      runtimeConstraints: config.constraints,
      feedbackUsed: relevantFeedback,
      promptVersion: this.getPromptVersion(),
      tokensUsed: 0,
      attempts: 0
    };
  }
  
  /**
   * Generate content with quality feedback loop
   */
  private async generateWithQualityLoop(
    config: GenerationConfig, 
    context: GenerationContext
  ): Promise<UniversalCapsule> {
    
    let attempt = 1;
    let bestCapsule: UniversalCapsule | null = null;
    let bestQuality = 0;
    
    while (attempt <= config.maxRegenerationAttempts) {
      console.log(`🎯 Generation attempt ${attempt}/${config.maxRegenerationAttempts}`);
      
      try {
        // Generate content
        const rawContent = await this.callAzureOpenAI(
          context.systemPrompt, 
          context.userPrompt, 
          config
        );
        
        context.tokensUsed += rawContent.tokensUsed;
        context.attempts = attempt;
        
        // Parse and structure content
        const capsule = await this.parseAndStructureCapsule(rawContent.content, config);
        
        // Quick quality assessment
        const quality = await this.quickQualityCheck(capsule, config);
        
        console.log(`📊 Attempt ${attempt} quality: ${quality.toFixed(2)}`);
        
        // Keep best result
        if (quality > bestQuality) {
          bestCapsule = capsule;
          bestQuality = quality;
        }
        
        // If quality is good enough, stop
        if (quality >= config.qualityThreshold) {
          console.log(`✅ Quality threshold met: ${quality.toFixed(2)} >= ${config.qualityThreshold}`);
          break;
        }
        
        // Adjust prompt for next attempt based on quality issues
        if (attempt < config.maxRegenerationAttempts) {
          context.systemPrompt = this.adjustPromptForQuality(
            context.systemPrompt, 
            capsule, 
            quality
          );
        }
        
        attempt++;
        
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`⚠️ Attempt ${attempt} failed:`, message);
        attempt++;
      }
    }
    
    if (!bestCapsule) {
      throw new Error('Failed to generate any valid capsule content');
    }
    
    console.log(`🎉 Best quality achieved: ${bestQuality.toFixed(2)}`);
    return bestCapsule;
  }
  
  /**
   * Call Azure OpenAI GPT-4o with proper configuration
   */
  private async callAzureOpenAI(
    systemPrompt: string, 
    userPrompt: string, 
    config: GenerationConfig
  ): Promise<AIResponse> {
    
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      {
        role: 'user' as const,
        content: userPrompt
      }
    ];
    
    // Mock implementation - return structured response
    const content = await this.callOpenAI(messages as AIMessage[], {
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 4000
    });
    
    return {
      content,
      tokensUsed: 1000 // Mock token count
    };
  }
    
  /**
   * Make API call to Azure OpenAI GPT-4o
   */
  private async callOpenAI(messages: AIMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    // Check if AI service is available
    if (!this.aiService) {
      console.warn('🔄 No AI service available, using mock data for development');
      return this.getMockResponse(messages);
    }

    try {
      const response = await this.aiService.generateContent(messages, {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        responseFormat: 'json'
      });
      
      return response.content;
    } catch (error) {
      console.error('AI service call failed:', error);
      
      // Fallback to mock data for development
      console.warn('🔄 Falling back to mock data for development');
      return this.getMockResponse(messages);
    }
  }

  private getMockResponse(messages: AIMessage[]): string {
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.content.toLowerCase();

    // Generate contextual mock responses based on prompt
    if (prompt.includes('reverse') || prompt.includes('string')) {
      return JSON.stringify({
        title: "String Reversal Challenge",
        description: "Learn how to reverse a string using JavaScript",
        content: {
          starterCode: "function reverseString(str) {\n  // Your code here\n  \n}",
          solution: "function reverseString(str) {\n  return str.split('').reverse().join('');\n}",
          testCases: [
            { input: "hello", expected: "olleh", description: "Basic string reversal" },
            { input: "world", expected: "dlrow", description: "Another test case" }
          ],
          hints: [
            "Consider using string methods like split(), reverse(), and join()",
            "Think about converting the string to an array first",
            "Remember that strings are immutable in JavaScript"
          ]
        },
        runtime: {
          target: "wasm",
          language: "javascript",
          timeLimit: 5000,
          memoryLimit: 128
        }
      });
    }

    // Default mock response
    return JSON.stringify({
      title: "Generated Learning Capsule",
      description: "Interactive learning content generated by AI",
      content: {
        starterCode: "// Write your code here\nconsole.log('Hello, world!');",
        solution: "console.log('Hello, world!');\nconsole.log('Welcome to coding!');",
        testCases: [
          { input: "", expected: "Hello, world!\nWelcome to coding!", description: "Basic output test" }
        ],
        hints: [
          "Start with a simple console.log statement",
          "Remember to end statements with semicolons",
          "Add a second console.log for the welcome message"
        ]
      },
      runtime: {
        target: "wasm",
        language: "javascript",
        timeLimit: 5000,
        memoryLimit: 128
      }
    });
  }

  /**
   * Generate content with AI model
   */
  private async generateWithAI(
    systemPrompt: string,
    userPrompt: string,
    config: GenerationConfig
  ): Promise<{ content: string; tokensUsed: number }> {
    console.log(`🤖 Calling Azure OpenAI GPT-4o...`);
    console.log(`📝 System prompt: ${systemPrompt.substring(0, 200)}...`);
    console.log(`💬 User prompt: ${userPrompt}`);
    
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    const content = await this.callOpenAI(messages, {
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 4000
    });
    
    const tokensUsed = 1000; // Mock token count
    
    if (!content) {
      throw new Error('No content received from Azure OpenAI');
    }
    
    console.log(`✅ Received response: ${tokensUsed} tokens`);
    
    return {
      content,
      tokensUsed
    };
  }
  
  /**
   * Build runtime-aware system prompt
   */
  private buildRuntimeAwarePrompt(config: GenerationConfig): string {
    const basePrompt = `You are an expert educational content creator specializing in interactive learning experiences.`;
    
    let runtimeInstructions = '';
    
    if (config.runtimeTarget === 'wasm') {
      runtimeInstructions = `
CRITICAL RUNTIME CONSTRAINTS (WASM Target - Free Tier):
- Generate ONLY single-file solutions
- NO file system operations (fs, readFile, writeFile)
- NO network requests (fetch, axios, http)
- Simple, fast-executing code only
- Maximum execution time: 5 seconds
- Browser-compatible languages only
- Keep complexity moderate for optimal performance
- Focus on core algorithmic concepts`;
    } else if (config.runtimeTarget === 'docker') {
      runtimeInstructions = `
ENHANCED CAPABILITIES (Docker Target - Pro Tier):
- Multi-file projects are encouraged
- File system operations permitted
- Network requests and APIs available
- Database interactions allowed
- Complex test suites with setup/teardown
- External dependencies welcome
- No execution time limits
- Real-world complexity scenarios`;
    }
    
    return basePrompt + runtimeInstructions;
  }
  
  /**
   * Build comprehensive system prompt with all context
   */
  private buildSystemPrompt(
    config: GenerationConfig,
    runtimePrompt: string,
    pedagogicalConstraints: string,
    feedback: AIToHumanEdit[]
  ): string {
    
    let feedbackInstructions = '';
    if (feedback.length > 0) {
      const commonIssues = this.analyzeCommonFeedbackPatterns(feedback);
      feedbackInstructions = `
CREATOR FEEDBACK PATTERNS (Learn from these):
${commonIssues.map(issue => `- ${issue}`).join('\n')}

Based on creator edits, pay special attention to:
- Code clarity and readability
- Proper test case coverage
- Clear problem statements
- Appropriate hint progression`;
    }

    let languageConstraints = '';
    if (config.allowedLanguages && config.allowedLanguages.length > 0) {
      const language = config.allowedLanguages[0]; // Use the first allowed language
      languageConstraints = `
CRITICAL LANGUAGE REQUIREMENT:
- You MUST generate all code in ${language} language only
- Use ${language} syntax, comments, and conventions throughout
- For ${language === 'python' ? 'Python use # comments, def functions, proper indentation' : 
         language === 'javascript' ? 'JavaScript use // comments, function declarations, camelCase' :
         language === 'java' ? 'Java use // comments, public class structure, camelCase' :
         `${language} use appropriate syntax and conventions`}
- Do NOT mix languages - everything must be valid ${language} code
- Starter code, solution, and test cases must all be in ${language}`;
    }

    return `${runtimePrompt}

${pedagogicalConstraints}

${feedbackInstructions}

${languageConstraints}

CONTENT GENERATION REQUIREMENTS:
- Generate content for capsule type: ${config.capsuleType}
- Target difficulty: ${config.difficulty}
- Estimated completion time: ${config.estimatedTime || 15} minutesOUTPUT FORMAT:
${config.capsuleType === 'database' ? `
For DATABASE problems, respond with this JSON structure:
{
  "title": "Clear, engaging title",
  "context": "1-2 sentence real-world motivation. Why a working engineer would need this skill. Example: 'Your analytics dashboard needs to show monthly revenue trends. The finance team wants year-over-year comparisons.'",
  "task": "Direct, actionable build instruction. What the learner must do. Example: 'Write a query that calculates monthly revenue and compares it to the same month last year.'",
  "insight": "The aha-moment revealed AFTER the learner passes all tests. A concise takeaway connecting the exercise to production practice. Example: 'Window functions like LAG() let you compare rows across time periods without self-joins — this is how dashboards compute period-over-period metrics at scale.'",
  "realWorldUsage": "Brief note on where this pattern appears in production. Example: 'Used in BI dashboards, financial reporting APIs, and data pipeline aggregations.'",
  "description": "Full problem statement combining context and task for backward compatibility.",
  "content": {
    "schema": {
      "tables": [{"name": "table_name", "columns": ["column1 (TYPE)", "column2 (TYPE)"]}]
    },
    "sampleData": "Representative data for the scenario",
    "query": "The SQL query challenge",
    "solution": "Complete solution query",
    "testCases": [{"input": "test setup", "expected": "expected result", "description": "Test description"}]
  },
  "pedagogicalData": {
    "hints": [{"content": "hint text", "trigger": "on_request"}],
    "concepts": ["SQL fundamentals", "Database design"]
  }
}

CRITICAL DATABASE REQUIREMENTS:
- context MUST be a real-world motivation, NOT the generation instructions
- task MUST be a clear, actionable instruction
- insight MUST be a genuine aha-moment, revealed only after success
- Include realistic database schema and sample data
- Provide progressive difficulty in queries
- Focus on practical SQL skills
` : config.capsuleType === 'code' ? `
For CODING problems, respond with this JSON structure:
{
  "title": "Clear, engaging title",
  "context": "1-2 sentence real-world motivation. Why a working engineer would need this skill. Example: 'Your API rate limiter needs to track request counts per user within sliding time windows.'",
  "task": "Direct, actionable build instruction. What the learner must do. Example: 'Implement a sliding window counter that tracks hits in the last N seconds and returns the count.'",
  "insight": "The aha-moment revealed AFTER the learner passes all tests. A concise takeaway connecting the exercise to production practice. Example: 'Sliding window counters trade O(1) memory per fixed bucket for approximate counts — this is how Redis rate limiters and real-time analytics work at scale.'",
  "realWorldUsage": "Brief note on where this pattern appears in production. Example: 'Used in API rate limiters, real-time analytics dashboards, and network traffic monitoring.'",
  "description": "Full problem statement combining context and task for backward compatibility.",
  "content": {
    "starterCode": "// Incomplete template with function signature and TODO comments",
    "solution": "// Complete working solution with proper implementation",
    "testCases": [
      {"input": "test input", "expected": "expected output", "description": "Test description"}
    ]
  },
  "pedagogicalData": {
    "hints": [{"content": "hint text", "trigger": "on_request"}],
    "concepts": ["concept1", "concept2"]
  }
}

CRITICAL CODING REQUIREMENTS:
- starterCode MUST be different from solution - provide function signature with TODO comments
- solution MUST be a complete, working implementation 
- Generate EXACTLY 5 test cases using the "Golden 5" strategy:
  1. SMOKE (visible): Basic example from the problem. Verifies the code runs.
  2. BASIC (visible): Simple variation. Helps debug logic.
  3. COMPLEX (hidden): Larger input. Prevents hardcoding.
  4. EDGE (hidden): Boundary: zero, empty, null, negative.
  5. SCALE (hidden): Large input. Tests efficiency (must run in <3s).
- testCases MUST have input_args (array), expected_output, description, type, and visible fields
- Keep scale test inputs reasonable (no larger than 1000 elements)
` : `
Respond with valid JSON matching this structure:
{
  "title": "Clear, engaging title",
  "context": "1-2 sentence real-world motivation for this exercise.",
  "task": "Direct, actionable build instruction.",
  "insight": "Aha-moment revealed after the learner passes all tests.",
  "realWorldUsage": "Where this pattern appears in production.",
  "description": "Full problem statement for backward compatibility.",
  "content": {
    // Type-specific content structure
  },
  "pedagogicalData": {
    "hints": [{"content": "hint text", "trigger": "on_request"}],
    "concepts": ["concept1", "concept2"]
  }
}`}

Focus on creating pedagogically sound, engaging learning experiences that help learners understand core concepts progressively.`;
  }
  
  /**
   * Clean AI response by removing markdown code blocks and extra whitespace
   */
  private cleanAIResponse(content: string): string {
    console.log(`🧹 Cleaning AI response (${content.length} chars)...`);
    console.log(`📄 Raw content (first 500 chars):`, content.substring(0, 500));
    
    // Remove markdown code blocks (```json, ```, etc.)
    let cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^```[\w]*\s*/gm, '')  // Remove code block markers at start of line
      .trim();
    
    console.log(`🔄 After markdown removal (first 200 chars):`, cleaned.substring(0, 200));
    
    // Find the first '{' and last '}' to extract JSON content
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    console.log(`🔍 Brace positions - first: ${firstBrace}, last: ${lastBrace}`);
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      console.log(`📦 Extracted JSON content (${cleaned.length} chars)`);
      console.log(`📝 Extracted content (first 200 chars):`, cleaned.substring(0, 200));
    }
    
    // Use JSON5 or relaxed parsing approach - try to fix common JSON issues
    try {
      // First attempt: parse as-is
      const testParse = JSON.parse(cleaned);
      console.log(`✅ JSON validation successful (no cleaning needed)`);
      return cleaned;
    } catch (error) {
      console.log(`🔧 Initial JSON parse failed, attempting to fix...`);
      
      // Fix common issues:
      // 1. Convert Python values to JSON equivalents
      let fixed = cleaned
        .replace(/\bNone\b/g, 'null')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false');
      
      // 2. Escape unescaped newlines in string values
      fixed = fixed.replace(/"([^"]*?)(\n|\r\n|\r)([^"]*?)"/g, (match, before, newline, after) => {
        return `"${before}\\n${after}"`;
      });
      
      // 3. Fix unescaped quotes within strings (basic approach)
      fixed = fixed.replace(/: "([^"]*?)"([^,}\]]*?)"/g, ': "$1\\"$2"');
      
      console.log(`🔧 Attempting to parse fixed JSON...`);
      console.log(`🔍 Fixed content (first 300 chars):`, fixed.substring(0, 300));
      
      try {
        JSON.parse(fixed);
        console.log(`✅ JSON validation successful after fixes`);
        return fixed;
      } catch (finalError) {
        console.error(`❌ JSON validation failed even after fixes:`, finalError instanceof Error ? finalError.message : String(finalError));
        console.log(`🔧 Final invalid JSON content:`, fixed.substring(0, 500));
        return cleaned; // Return original if fixes don't work
      }
    }
  }
  
  /**
   * Parse AI response into structured capsule
   */
  private async parseAndStructureCapsule(
    content: string, 
    config: GenerationConfig
  ): Promise<UniversalCapsule> {
    
    console.log(`🔧 Parsing AI response into capsule structure...`);
    
    try {
      // Clean the content to handle markdown code blocks
      const cleanContent = this.cleanAIResponse(content);
      console.log(`🧹 Cleaned content length: ${cleanContent.length} chars`);
      
      let parsed;
      try {
        parsed = JSON.parse(cleanContent);
        console.log(`✅ JSON parsing successful`);
        console.log(`📋 Parsed keys:`, Object.keys(parsed));
      } catch (parseError) {
        console.error(`❌ JSON parsing failed:`, parseError instanceof Error ? parseError.message : String(parseError));
        console.log(`🔧 Problematic content (first 1000 chars):`, cleanContent.substring(0, 1000));
        throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      // Transform AI output to universal capsule format
      const capsule: UniversalCapsule = {
        id: this.generateId(),
        type: config.capsuleType,
        title: parsed.title,
        description: parsed.description,
        context: parsed.context || '',
        task: parsed.task || '',
        insight: parsed.insight || '',
        realWorldUsage: parsed.realWorldUsage || '',
        
        // Runtime configuration (your cost moat)
        runtime: {
          target: config.runtimeTarget,
          constraints: config.constraints,
          tier: config.runtimeTarget === 'wasm' ? 'free' : 'pro',
          costModel: {
            executionCost: config.runtimeTarget === 'wasm' ? 0 : 0.01,
            storageCost: 0.001,
            bandwidthCost: 0.001,
            aiGenerationCost: 0.05
          },
          optimization: {
            prioritizeCacheability: config.runtimeTarget === 'wasm',
            minimizeServerRequests: config.runtimeTarget === 'wasm',
            enableProgressiveLoading: true
          }
        },
        
        // Adaptive content
        content: this.transformContentForRuntime(parsed.content, config, parsed),
        
        // Execution context
        execution: {},
        
        // Learning framework
        learning: {},
        
        // Analytics configuration
        analytics: {},
        
        // Feedback configuration  
        feedback: {},
        
        // Enhanced capabilities
        events: {
          collector: {} as any,
          sessionMetrics: {} as any,
          realTimeInsights: true
        },
        
        creatorFeedback: {
          capture: this.feedbackSystem,
          trainingData: [],
          qualityScore: 0.8
        },
        
        pedagogy: {
          learningObjectives: parsed.pedagogicalData?.learningObjectives || [],
          prerequisites: [],
          concepts: parsed.pedagogicalData?.concepts?.map((c: string) => ({
            concept: c,
            dependencies: [],
            difficulty: 1
          })) || [],
          difficulty: {
            current: config.difficulty,
            progression: ['easy', 'medium', 'hard'],
            adaptiveScaling: true
          },
          hints: {
            sequence: parsed.pedagogicalData?.hints || [],
            progressive: true,
            contextAware: true
          }
        },
        
        business: {
          tier: config.runtimeTarget === 'wasm' ? 'free' : 'pro',
          costOptimization: {
            wasmFirst: config.runtimeTarget === 'wasm',
            cacheStrategy: 'aggressive',
            bandwidthMinimization: true
          },
          revenueMetrics: {
            costPerExecution: config.runtimeTarget === 'wasm' ? 0 : 0.01,
            revenuePerSession: 0,
            lifetimeValue: 0
          }
        }
      };
      
      console.log(`✅ Successfully parsed capsule: ${capsule.title}`);
      return capsule;
      
    } catch (error) {
      console.error(`❌ Failed to parse AI response:`, error);
      const message = error instanceof Error ? error.message : 'Unknown parsing error';
      throw new Error(`Invalid AI response format: ${message}`);
    }
  }
  
  // ===== UTILITY METHODS =====
  
  private generateId(): string {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getPromptVersion(): string {
    return 'v1.0.0';
  }
  
  private async getRelevantCreatorFeedback(config: GenerationConfig): Promise<AIToHumanEdit[]> {
    // In production, query your feedback database
    // For now, return empty array
    return [];
  }
  
  private getPedagogicalConstraints(config: GenerationConfig): string {
    return `
PEDAGOGICAL FRAMEWORK:
- Target difficulty: ${config.difficulty}
- Learning progression: Concepts should build upon each other
- Hint strategy: Progressive disclosure, not giving away solutions
- Assessment: Include diverse test cases that validate understanding
- Engagement: Make problems relevant and interesting`;
  }
  
  private analyzeCommonFeedbackPatterns(feedback: AIToHumanEdit[]): string[] {
    // Analyze feedback patterns to improve generation
    return [
      'Ensure code examples are syntactically correct',
      'Provide more detailed problem descriptions',
      'Include edge cases in test scenarios'
    ];
  }
  
  private transformContentForRuntime(content: any, config: GenerationConfig, parsed?: any): any {
    // Transform AI-generated content based on runtime target
    const primary: any = {
      problemStatement: parsed?.description || content.description || content.title || config.prompt,
      context: parsed?.context || content.context || '',
      task: parsed?.task || content.task || '',
      insight: parsed?.insight || content.insight || '',
      realWorldUsage: parsed?.realWorldUsage || content.realWorldUsage || '',
    };

    // Handle code capsule content - check both direct and nested structures
    const codeContent = content.code || content.content || content;
    const starterCode = content.starterCode || codeContent.starterCode || codeContent.starter;
    const solution = content.solution || codeContent.solution || codeContent.solutionCode;
    const testCases = content.testCases || codeContent.testCases || codeContent.tests || [];
    
    console.log(`🔍 Code extraction - starterCode: ${!!starterCode}, solution: ${!!solution}, testCases: ${testCases.length}`);
    
    if (config.capsuleType === 'code') {
      if (config.runtimeTarget === 'wasm') {
        // Ensure we have different starter code vs solution
        const finalStarterCode = starterCode || '// Write your code here';
        const finalSolution = solution || 'console.log("Hello World");';
        
        // If they're identical, create a proper starter template
        let processedStarterCode = finalStarterCode;
        let processedSolution = finalSolution;
        
        if (finalStarterCode === finalSolution) {
          // Extract function signature or structure from solution to create starter
          processedStarterCode = this.createStarterFromSolution(finalSolution);
        }
        
        primary.code = {
          wasmVersion: {
            starterCode: processedStarterCode,
            solution: processedSolution,
            testCases: this.formatTestCases(testCases),
            language: this.extractLanguageFromConstraints(config),
            complexity: config.difficulty === 'hard' ? 'medium' : config.difficulty // WASM can't be 'high'
          }
        };
      } else if (config.runtimeTarget === 'docker') {
        primary.code = {
          dockerVersion: {
            projectStructure: [{
              path: 'main.js',
              content: solution || 'console.log("Hello World");',
              type: 'file'
            }],
            dependencies: [],
            buildSteps: [],
            testSuites: [],
            complexity: config.difficulty
          }
        };
      }
    }

    // Handle other capsule types...
    // TODO: Add quiz, terminal, database, system-design transformations

    return { primary };
  }

  private extractLanguageFromConstraints(config: GenerationConfig): 'javascript' | 'python' {
    // Extract language from WASM constraints
    if (config.constraints?.target === 'wasm' && config.constraints.wasmLimitations?.allowedLanguages) {
      const allowed = config.constraints.wasmLimitations.allowedLanguages;
      if (allowed.includes('javascript')) return 'javascript';
      if (allowed.includes('python')) return 'python';
    }
    return 'javascript'; // Default
  }
  
  private async quickQualityCheck(capsule: UniversalCapsule, config: GenerationConfig): Promise<number> {
    // Quick quality assessment (more detailed quality check later)
    let score = 1.0;
    
    console.log(`🔍 Quality check - Title: "${capsule.title}" (${capsule.title?.length || 0} chars)`);
    console.log(`🔍 Quality check - Description: "${capsule.description?.substring(0, 50)}..." (${capsule.description?.length || 0} chars)`);
    console.log(`🔍 Quality check - Concepts: ${capsule.pedagogy?.concepts?.length || 0} items`);
    
    if (!capsule.title || capsule.title.length < 5) {
      console.log(`⚠️  Title too short: "${capsule.title}"`);
      score -= 0.2;
    }
    if (!capsule.description || capsule.description.length < 20) {
      console.log(`⚠️  Description too short: "${capsule.description}"`);
      score -= 0.3;
    }
    // Concepts check (optional, minor deduction)
    if (capsule.pedagogy?.concepts?.length === 0) {
      console.log(`⚠️  No concepts provided (minor deduction)`);
      score -= 0.1; // Reduced penalty
    }
    
    const finalScore = Math.max(0, score);
    console.log(`📊 Final quality score: ${finalScore}`);
    return finalScore;
  }
  
  private adjustPromptForQuality(prompt: string, capsule: UniversalCapsule, quality: number): string {
    // Adjust prompt based on quality issues
    if (quality < 0.5) {
      return prompt + '\n\nIMPORTANT: Ensure all required fields are complete and detailed.';
    }
    return prompt;
  }
  
  private async postProcessCapsule(capsule: UniversalCapsule, config: GenerationConfig): Promise<UniversalCapsule> {
    // Final post-processing and validation
    return capsule;
  }
  
  private async assessQuality(capsule: UniversalCapsule, config: GenerationConfig): Promise<number> {
    // Comprehensive quality assessment
    return 0.85; // Placeholder
  }
  
  private async generateSuggestions(capsule: UniversalCapsule, config: GenerationConfig): Promise<string[]> {
    // Generate improvement suggestions
    return ['Consider adding more detailed examples', 'Test cases could be more comprehensive'];
  }
  
  /**
   * Create a proper starter code template from a complete solution
   */
  private createStarterFromSolution(solution: string): string {
    // Extract function signature and create starter template
    const funcMatch = solution.match(/function\s+(\w+)\s*\([^)]*\)\s*{/);
    if (funcMatch) {
      const signature = funcMatch[0];
      return `${signature}\n  // Your code here\n  \n}`;
    }
    
    // Extract arrow function
    const arrowMatch = solution.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/);
    if (arrowMatch) {
      return `${arrowMatch[0]} {\n  // Your code here\n  \n}`;
    }
    
    // Extract class definition
    const classMatch = solution.match(/class\s+(\w+)\s*{/);
    if (classMatch) {
      return `${classMatch[0]}\n  // Your code here\n  \n}`;
    }
    
    // Default template
    return '// Write your code here\n';
  }
  
  /**
   * Format test cases to ensure proper structure (Golden 5 strategy)
   */
  private formatTestCases(testCases: any[]): any[] {
    if (!Array.isArray(testCases)) {
      return [];
    }
    
    const GOLDEN_5_DEFAULTS = [
      { type: 'smoke',   visible: true },
      { type: 'basic',   visible: true },
      { type: 'complex', visible: false },
      { type: 'edge',    visible: false },
      { type: 'scale',   visible: false },
    ];

    // Cap at 5 test cases
    const capped = testCases.slice(0, 5);
    
    return capped.map((test, index) => {
      const golden = GOLDEN_5_DEFAULTS[index] || GOLDEN_5_DEFAULTS[GOLDEN_5_DEFAULTS.length - 1];
      
      // Handle different test case formats
      if (typeof test === 'object' && test !== null) {
        return {
          input_args: test.input_args || (test.input ? [test.input] : (test.args ? [test.args] : [])),
          expected_output: test.expected_output ?? test.expected ?? test.output ?? test.result ?? '',
          description: test.description || test.name || `Test case ${index + 1}`,
          type: test.type || golden.type,
          visible: test.visible ?? golden.visible,
          is_hidden: test.is_hidden ?? !golden.visible,
        };
      }
      
      // Handle string format
      if (typeof test === 'string') {
        return {
          input_args: [],
          expected_output: test,
          description: 'Basic test',
          type: golden.type,
          visible: golden.visible,
          is_hidden: !golden.visible,
        };
      }
      
      return test;
    });
  }
}

// ===== SUPPORTING TYPES =====

interface GenerationContext {
  systemPrompt: string;
  userPrompt: string;
  runtimeConstraints: RuntimeConstraints;
  feedbackUsed: AIToHumanEdit[];
  promptVersion: string;
  tokensUsed: number;
  attempts: number;
}

interface AIResponse {
  content: string;
  tokensUsed: number;
}

class GenerationError extends Error {
  constructor(message: string, public generationId: string) {
    super(message);
    this.name = 'GenerationError';
  }
}

/**
 * Factory function to create generation engine with proper configuration
 */
export function createGenerationEngine(): CapsuleGenerationEngine {
  // Check if Azure OpenAI configuration is available
  if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
    console.warn('⚠️  Azure OpenAI configuration missing - using mock AI responses');
    console.warn('   Set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT for real AI generation');
    
    // Return engine without AI service for development
    return new CapsuleGenerationEngine();
  }

  // Try to create AI service
  const aiService = tryCreateAIService();
  if (aiService) {
    return new CapsuleGenerationEngine(aiService);
  } else {
    console.warn('⚠️  Could not create AI service, using mock generation engine');
    return new CapsuleGenerationEngine();
  }
}

export { GenerationError };