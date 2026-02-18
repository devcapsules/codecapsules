/**
 * Type-Specific Content Generators
 * 
 * Specialized AI generators for each capsule type:
 * - Code Challenges: Programming exercises with tests
 * - Interactive Quizzes: Assessment with explanations  
 * - Terminal Exercises: Command-line learning
 * 
 * Each generator has unique prompt patterns, validation rules,
 * and output structures optimized for that learning format.
 */

import { PromptEngineer } from './prompt-engineer';
import { createAIService, AIService } from '../services/ai-service';
import type { PromptContext, GeneratedPrompts } from './prompt-engineer';
import type { CapsuleType, DifficultyLevel } from '../types/capsule';
import type { RuntimeTarget, RuntimeConstraints } from '../types/runtime-aware';
import type { UniversalCapsule } from '../types/universal-capsule';
import type { AIToHumanEdit } from '../types/creator-feedback';

export interface TypeSpecificContext {
  type: CapsuleType;
  userPrompt: string;
  runtimeTarget: RuntimeTarget;
  constraints: RuntimeConstraints;
  difficulty: DifficultyLevel;
  creatorFeedback?: AIToHumanEdit[];
  metadata?: Record<string, any>;
}

export interface GeneratedContent {
  content: any;
  prompts: GeneratedPrompts;
  validationResults: ValidationResult[];
  typeSpecificMetadata: Record<string, any>;
}

export interface ValidationResult {
  rule: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Code Challenge Generator
 * 
 * Creates programming exercises with starter code,
 * test cases, hints, and solutions.
 */
export class CodeChallengeGenerator {
  private promptEngineer: PromptEngineer;
  private aiService: any; // Accept any compatible AI service
  
  constructor(aiService?: any) {
    this.promptEngineer = new PromptEngineer();
    if (aiService) {
      this.aiService = aiService;
    } else {
      try {
        this.aiService = createAIService();
      } catch (error) {
        console.warn('AI Service initialization failed, using fallback mode:', error);
        this.aiService = null;
      }
    }
  }
  
  async generate(context: TypeSpecificContext): Promise<GeneratedContent> {
    console.log(`💻 Generating code challenge: ${context.difficulty} level`);
    
    // Build code-specific prompt context
    const promptContext: PromptContext = {
      ...context,
      capsuleType: 'code',
      learningObjectives: this.deriveCodeLearningObjectives(context.userPrompt, context.difficulty)
    };
    
    // Generate specialized prompts for code challenges
    const prompts = this.generateCodePrompts(promptContext);
    
    // Simulate AI generation (in production, this calls Azure OpenAI)
    const content = await this.generateCodeContent(prompts, context);
    
    // Validate the generated content
    const validationResults = this.validateCodeContent(content, context);
    
    return {
      content,
      prompts,
      validationResults,
      typeSpecificMetadata: {
        estimatedSolvingTime: this.estimateSolvingTime(content, context.difficulty),
        codeComplexity: this.calculateCodeComplexity(content),
        testCoverage: this.calculateTestCoverage(content),
        hintProgression: this.validateHintProgression(content.hints)
      }
    };
  }
  
  private generateCodePrompts(context: PromptContext): GeneratedPrompts {
    const basePrompts = this.promptEngineer.generatePrompts(context);
    
    // Add code-specific instructions
    const codeSpecificInstructions = `
📋 CODE CHALLENGE SPECIFIC REQUIREMENTS:

STRUCTURE YOUR RESPONSE AS:
{
  "title": "Descriptive challenge title",
  "description": "What the learner will build/solve",
  "starterCode": "Initial code with TODOs and structure",
  "solutionCode": "Complete working solution",
  "testCases": [
    {
      "description": "Smoke test - basic example",
      "type": "smoke",
      "input_args": [arg1],
      "expected_output": result,
      "visible": true,
      "is_hidden": false
    },
    {
      "description": "Basic logic - simple variation",
      "type": "basic",
      "input_args": [arg1],
      "expected_output": result,
      "visible": true,
      "is_hidden": false
    },
    {
      "description": "Complex case - prevents hardcoding",
      "type": "complex",
      "input_args": [complex_args],
      "expected_output": result,
      "visible": false,
      "is_hidden": true
    },
    {
      "description": "Edge case - boundary inputs",
      "type": "edge",
      "input_args": [edge_arg],
      "expected_output": result,
      "visible": false,
      "is_hidden": true
    },
    {
      "description": "Scale test - larger input",
      "type": "scale",
      "input_args": [large_arg],
      "expected_output": result,
      "visible": false,
      "is_hidden": true
    }
  ],
  "hints": [
    {
      "stage": "getting_started",
      "text": "First hint to get unstuck",
      "codeExample": "optional code snippet"
    },
    {
      "stage": "implementation",
      "text": "Implementation guidance",
      "codeExample": "key algorithm insight"
    },
    {
      "stage": "optimization",
      "text": "Performance or style improvement",
      "codeExample": "optimized approach"
    }
  ],
  "concepts": ["array manipulation", "algorithm design", "edge cases"],
  "timeEstimate": "15 minutes",
  "successCriteria": "All tests pass + code is readable"
}

GOLDEN 5 TEST CASE RULES:
- Generate EXACTLY 5 test cases in this order: smoke, basic, complex, edge, scale
- Tests 1-2 are visible to students, tests 3-5 are hidden (anti-cheat)
- input_args MUST be a JSON array, even for single arguments
- expected_output must be the raw value (not stringified)
- Scale test must execute in under 3 seconds
- Edge case should test zero, empty, negative, or null inputs

QUALITY REQUIREMENTS:
- Starter code should compile but be incomplete
- Solution must pass all 5 test cases
- Hints should progressively reveal the solution
- Code should follow best practices for the language
`;
    
    return {
      ...basePrompts,
      systemPrompt: basePrompts.systemPrompt + codeSpecificInstructions,
      qualityChecks: [
        ...basePrompts.qualityChecks,
        'Starter code compiles but is incomplete',
        'Solution code passes all 5 test cases',
        'Test cases follow Golden 5 strategy (smoke, basic, complex, edge, scale)',
        'Hints provide progressive guidance',
        'Code follows language best practices'
      ]
    };
  }
  
  private async generateCodeContent(prompts: GeneratedPrompts, context: TypeSpecificContext): Promise<any> {
    // Try to use real Azure OpenAI first
    if (this.aiService) {
      try {
        console.log('🤖 Using Azure OpenAI GPT-4o for content generation...');
        console.log('📝 System prompt preview:', prompts.systemPrompt.substring(0, 200) + '...');
        console.log('📝 User prompt preview:', prompts.userPrompt.substring(0, 200) + '...');
        
        const messages = [
          { role: 'system' as const, content: prompts.systemPrompt },
          { role: 'user' as const, content: prompts.userPrompt }
        ];

        const aiContent = await this.aiService.generateJSON(messages);
        console.log('✅ AI content generated successfully');
        console.log('📋 AI response preview:', JSON.stringify(aiContent).substring(0, 300) + '...');
        
        // Validate and enhance AI response
        const enhancedContent = this.enhanceAIContent(aiContent, context);
        console.log('✅ Content enhanced and validated');
        return enhancedContent;
        
      } catch (error) {
        console.error('❌ AI generation failed, falling back to enhanced mock:', error);
        console.error('🔍 Error details:', error instanceof Error ? error.message : String(error));
      }
    } else {
      console.log('⚠️ No AI service available, using mock content');
    }

    // Fallback to enhanced mock content
    console.log('🔄 Using enhanced mock content generator...');
    return this.generateAILikeContent(context);
  }

  private enhanceAIContent(aiContent: any, context: TypeSpecificContext): any {
    // Ensure all required fields are present and properly formatted
    const enhanced = {
      title: aiContent.title || this.generateTitle(context.userPrompt),
      description: aiContent.description || `Learn ${this.extractConcepts(context.userPrompt).join(' and ')} through hands-on coding`,
      starterCode: aiContent.starterCode || this.generateStarterCode(context),
      solutionCode: aiContent.solutionCode || this.generateSolutionCode(context),
      testCases: Array.isArray(aiContent.testCases) ? aiContent.testCases : this.generateTestCases(context),
      hints: Array.isArray(aiContent.hints) ? aiContent.hints : this.generateHints(context),
      concepts: Array.isArray(aiContent.concepts) ? aiContent.concepts : this.extractConcepts(context.userPrompt),
      timeEstimate: aiContent.timeEstimate || this.estimateTime(context.difficulty),
      successCriteria: aiContent.successCriteria || (context.difficulty === 'advanced' ? 'All tests pass + optimal solution' : 'All tests pass')
    };

    // Validate test cases structure
    enhanced.testCases = enhanced.testCases.map((test: any) => {
      if (typeof test === 'string') {
        return { input: test, expectedOutput: 'expected', description: test, hidden: false };
      }
      return {
        input: test.input || 'test input',
        expectedOutput: test.expectedOutput || test.output || 'expected',
        description: test.description || test.input || 'test case',
        hidden: test.hidden || false
      };
    });

    // Validate hints structure
    enhanced.hints = enhanced.hints.map((hint: any, index: number) => {
      if (typeof hint === 'string') {
        return { 
          stage: index === 0 ? 'getting_started' : 'implementation', 
          text: hint, 
          codeExample: '' 
        };
      }
      return {
        stage: hint.stage || (index === 0 ? 'getting_started' : 'implementation'),
        text: hint.text || hint.hint || hint,
        codeExample: hint.codeExample || hint.code || ''
      };
    });

    return enhanced;
  }

  private generateAILikeContent(context: TypeSpecificContext): any {
    const prompt = context.userPrompt.toLowerCase();
    const language = context.constraints.wasmLimitations?.allowedLanguages[0] || 'javascript';
    
    // Generate more realistic content based on the actual prompt
    if (prompt.includes('calculator')) {
      return {
        title: "Interactive Calculator Challenge",
        description: "Build a calculator that can perform basic arithmetic operations with proper error handling",
        starterCode: language === 'javascript' ? 
          `function calculator(operation, a, b) {\n  // TODO: Implement calculator logic\n  // Handle: +, -, *, /\n  // Remember to handle division by zero!\n  return 0;\n}` :
          `def calculator(operation, a, b):\n    # TODO: Implement calculator logic\n    # Handle: +, -, *, /\n    # Remember to handle division by zero!\n    return 0`,
        solutionCode: language === 'javascript' ?
          `function calculator(operation, a, b) {\n  switch(operation) {\n    case '+': return a + b;\n    case '-': return a - b;\n    case '*': return a * b;\n    case '/': return b !== 0 ? a / b : 'Error: Division by zero';\n    default: return 'Error: Invalid operation';\n  }\n}` :
          `def calculator(operation, a, b):\n    if operation == '+':\n        return a + b\n    elif operation == '-':\n        return a - b\n    elif operation == '*':\n        return a * b\n    elif operation == '/':\n        return a / b if b != 0 else 'Error: Division by zero'\n    else:\n        return 'Error: Invalid operation'`,
        testCases: [
          { input: "'+', 5, 3", expectedOutput: "8", description: "handles addition", hidden: false },
          { input: "'*', 4, 7", expectedOutput: "28", description: "handles multiplication", hidden: false },
          { input: "'/', 10, 0", expectedOutput: "'Error: Division by zero'", description: "handles division by zero", hidden: false }
        ],
        hints: [
          { stage: "getting_started", text: "Start with a switch statement or if-else chain", codeExample: "switch(operation) { case '+': ... }" },
          { stage: "implementation", text: "Don't forget to handle edge cases like division by zero", codeExample: "if (b === 0) return 'Error';" }
        ],
        concepts: ["conditional logic", "error handling", "arithmetic operations"],
        timeEstimate: "10-15 minutes",
        successCriteria: "All operations work correctly with proper error handling"
      };
    }
    
    // Default enhanced content
    return {
      title: this.generateTitle(context.userPrompt),
      description: `Master ${this.extractConcepts(context.userPrompt).join(' and ')} with this hands-on coding challenge`,
      starterCode: this.generateStarterCode(context),
      solutionCode: this.generateSolutionCode(context),
      testCases: this.generateTestCases(context),
      hints: this.generateHints(context),
      concepts: this.extractConcepts(context.userPrompt),
      timeEstimate: this.estimateTime(context.difficulty),
      successCriteria: context.difficulty === 'advanced' ? 'All tests pass + optimal solution' : 'All tests pass'
    };
  }
  
  private generateStarterCode(context: TypeSpecificContext): string {
    const language = context.constraints.wasmLimitations?.allowedLanguages[0] || 'javascript';
    const prompt = context.userPrompt.toLowerCase();
    
    if (prompt.includes('sort')) {
      return language === 'javascript' ? 
        `function sortArray(arr) {\n  // TODO: Implement sorting algorithm\n  // Hint: Consider different approaches\n  return arr;\n}` :
        `def sort_array(arr):\n    # TODO: Implement sorting algorithm\n    # Hint: Consider different approaches\n    return arr`;
    }
    
    if (prompt.includes('search')) {
      return language === 'javascript' ?
        `function search(arr, target) {\n  // TODO: Implement search algorithm\n  // Return the index of target, or -1 if not found\n  return -1;\n}` :
        `def search(arr, target):\n    # TODO: Implement search algorithm\n    # Return the index of target, or -1 if not found\n    return -1`;
    }
    
    return language === 'javascript' ?
      `function solve(input) {\n  // TODO: Implement your solution\n  return input;\n}` :
      `def solve(input):\n    # TODO: Implement your solution\n    return input`;
  }
  
  private generateSolutionCode(context: TypeSpecificContext): string {
    const language = context.constraints.wasmLimitations?.allowedLanguages[0] || 'javascript';
    const prompt = context.userPrompt.toLowerCase();
    
    if (prompt.includes('fibonacci')) {
      return language === 'javascript' ?
        `function fibonacci(n) {\n  if (n <= 1) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return b;\n}` :
        `def fibonacci(n):\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b`;
    }
    
    return language === 'javascript' ?
      `function solve(input) {\n  // Complete solution implementation\n  return processedInput;\n}` :
      `def solve(input):\n    # Complete solution implementation\n    return processed_input`;
  }
  
  private generateTestCases(context: TypeSpecificContext): any[] {
    // Golden 5 strategy: always generate exactly 5 categorized test cases
    return [
      {
        input_args: ["basic case"],
        expected_output: "expected result",
        description: "Smoke test - basic functionality",
        type: "smoke",
        visible: true,
        is_hidden: false
      },
      {
        input_args: ["simple variation"],
        expected_output: "variation result",
        description: "Basic logic - simple variation",
        type: "basic",
        visible: true,
        is_hidden: false
      },
      {
        input_args: ["complex case"],
        expected_output: "complex result",
        description: "Complex case - prevents hardcoding",
        type: "complex",
        visible: false,
        is_hidden: true
      },
      {
        input_args: [""],
        expected_output: "edge result",
        description: "Edge case - empty/boundary input",
        type: "edge",
        visible: false,
        is_hidden: true
      },
      {
        input_args: ["large input ".repeat(50)],
        expected_output: "scale result",
        description: "Scale test - larger input",
        type: "scale",
        visible: false,
        is_hidden: true
      }
    ];
  }
  
  private generateHints(context: TypeSpecificContext): any[] {
    const hints = [
      {
        stage: "getting_started",
        text: "Break down the problem into smaller steps",
        codeExample: "// Start with the simplest case"
      },
      {
        stage: "implementation", 
        text: "Consider the algorithm that best fits this problem",
        codeExample: "// Think about time and space complexity"
      }
    ];
    
    if (context.difficulty === 'advanced') {
      hints.push({
        stage: "optimization",
        text: "Can you optimize for better performance?",
        codeExample: "// Look for redundant operations"
      });
    }
    
    return hints;
  }
  
  private deriveCodeLearningObjectives(prompt: string, difficulty: DifficultyLevel): string[] {
    const objectives = ["Practice problem-solving skills", "Write clean, readable code"];
    
    if (prompt.toLowerCase().includes('algorithm')) {
      objectives.push("Understand algorithmic thinking");
    }
    
    if (difficulty === 'advanced') {
      objectives.push("Optimize for performance", "Handle edge cases");
    }
    
    return objectives;
  }
  
  private validateCodeContent(content: any, context: TypeSpecificContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Check if starter code is incomplete
    if (content.starterCode.includes('TODO') || content.starterCode.includes('implement')) {
      results.push({
        rule: 'starter_code_incomplete',
        passed: true,
        message: 'Starter code is appropriately incomplete',
        severity: 'info'
      });
    } else {
      results.push({
        rule: 'starter_code_incomplete',
        passed: false,
        message: 'Starter code should be incomplete to provide learning challenge',
        severity: 'warning'
      });
    }
    
    // Check test case coverage
    if (content.testCases && content.testCases.length >= 2) {
      results.push({
        rule: 'test_coverage',
        passed: true,
        message: `Good test coverage with ${content.testCases.length} cases`,
        severity: 'info'
      });
    } else {
      results.push({
        rule: 'test_coverage',
        passed: false,
        message: 'Need at least 2 test cases for proper validation',
        severity: 'error'
      });
    }
    
    // Check hint progression
    if (content.hints && content.hints.length >= 2) {
      results.push({
        rule: 'hint_progression',
        passed: true,
        message: 'Good hint progression provided',
        severity: 'info'
      });
    }
    
    // Runtime-specific validation
    if (context.runtimeTarget === 'wasm') {
      if (!content.solutionCode.includes('fetch') && !content.solutionCode.includes('fs.')) {
        results.push({
          rule: 'wasm_compatibility',
          passed: true,
          message: 'Code is WASM compatible',
          severity: 'info'
        });
      } else {
        results.push({
          rule: 'wasm_compatibility',
          passed: false,
          message: 'Code uses features not available in WASM',
          severity: 'error'
        });
      }
    }
    
    return results;
  }
  
  // Helper methods
  private generateTitle(prompt: string): string {
    const concepts = this.extractConcepts(prompt);
    return `${concepts[0] || 'Programming'} Challenge`;
  }
  
  private extractConcepts(prompt: string): string[] {
    const concepts = [];
    const lower = prompt.toLowerCase();
    
    if (lower.includes('sort')) concepts.push('Sorting');
    if (lower.includes('search')) concepts.push('Searching');
    if (lower.includes('fibonacci')) concepts.push('Recursion');
    if (lower.includes('array')) concepts.push('Arrays');
    if (lower.includes('string')) concepts.push('String Manipulation');
    
    return concepts.length > 0 ? concepts : ['Problem Solving'];
  }
  
  private estimateTime(difficulty: DifficultyLevel): string {
    const timeMap = {
      beginner: '10-15 minutes',
      intermediate: '20-30 minutes', 
      advanced: '45-60 minutes'
    };
    return timeMap[difficulty];
  }
  
  private estimateSolvingTime(content: any, difficulty: DifficultyLevel): number {
    const base = difficulty === 'beginner' ? 10 : difficulty === 'intermediate' ? 25 : 45;
    const testComplexity = content.testCases?.length || 1;
    return base + (testComplexity * 2);
  }
  
  private calculateCodeComplexity(content: any): number {
    // Simple complexity calculation based on code length and control structures
    const code = content.solutionCode || '';
    let complexity = 1;
    
    complexity += (code.match(/if|for|while|switch/g) || []).length;
    complexity += (code.match(/function|class/g) || []).length * 0.5;
    
    return Math.min(complexity, 10);
  }
  
  private calculateTestCoverage(content: any): number {
    const testCases = content.testCases || [];
    const hasBasicCase = testCases.some((tc: any) => !tc.hidden);
    const hasEdgeCase = testCases.some((tc: any) => tc.description?.includes('edge'));
    const hasErrorCase = testCases.some((tc: any) => tc.description?.includes('error'));
    
    let coverage = 0;
    if (hasBasicCase) coverage += 40;
    if (hasEdgeCase) coverage += 30;
    if (hasErrorCase) coverage += 30;
    
    return coverage;
  }
  
  private validateHintProgression(hints: any[]): boolean {
    if (!hints || hints.length < 2) return false;
    
    const stages = hints.map(h => h.stage);
    return stages.includes('getting_started') && 
           (stages.includes('implementation') || stages.includes('optimization'));
  }
}

/**
 * Quiz Generator
 * 
 * Creates interactive assessments with multiple choice,
 * true/false, and short answer questions.
 */
export class QuizGenerator {
  private promptEngineer: PromptEngineer;
  private aiService: any; // Accept any compatible AI service
  
  constructor(aiService?: any) {
    this.promptEngineer = new PromptEngineer();
    if (aiService) {
      this.aiService = aiService;
    } else {
      try {
        this.aiService = createAIService();
      } catch (error) {
        console.warn('AI Service initialization failed, using fallback mode:', error);
        this.aiService = null;
      }
    }
  }
  
  async generate(context: TypeSpecificContext): Promise<GeneratedContent> {
    console.log(`❓ Generating quiz: ${context.difficulty} level`);
    
    const promptContext: PromptContext = {
      ...context,
      capsuleType: 'quiz',
      learningObjectives: this.deriveQuizLearningObjectives(context.userPrompt)
    };
    
    const prompts = this.generateQuizPrompts(promptContext);
    const content = await this.generateQuizContent(prompts, context);
    const validationResults = this.validateQuizContent(content, context);
    
    return {
      content,
      prompts,
      validationResults,
      typeSpecificMetadata: {
        questionTypes: this.analyzeQuestionTypes(content.questions),
        difficultyDistribution: this.analyzeDifficultyDistribution(content.questions),
        estimatedCompletionTime: this.estimateQuizTime(content.questions),
        pedagogicalBalance: this.analyzePedagogicalBalance(content.questions)
      }
    };
  }
  
  private generateQuizPrompts(context: PromptContext): GeneratedPrompts {
    const basePrompts = this.promptEngineer.generatePrompts(context);
    
    const quizSpecificInstructions = `
❓ QUIZ SPECIFIC REQUIREMENTS:

STRUCTURE YOUR RESPONSE AS:
{
  "title": "Engaging quiz title",
  "description": "What knowledge this quiz assesses",
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Clear, specific question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct and others are wrong",
      "difficulty": "easy",
      "concepts": ["concept1", "concept2"]
    },
    {
      "id": "q2", 
      "type": "true-false",
      "question": "Statement to evaluate",
      "correctAnswer": true,
      "explanation": "Detailed explanation of the concept",
      "difficulty": "medium",
      "concepts": ["concept3"]
    }
  ],
  "passingScore": 70,
  "timeLimit": "10 minutes"
}

PEDAGOGICAL REQUIREMENTS:
- Questions should test understanding, not memorization
- Include scenario-based questions for practical application
- Provide detailed explanations that teach
- Balance easy/medium/hard questions appropriately
- Wrong answers should be plausible but clearly incorrect
- Explanations should clarify common misconceptions
`;
    
    return {
      ...basePrompts,
      systemPrompt: basePrompts.systemPrompt + quizSpecificInstructions,
      qualityChecks: [
        ...basePrompts.qualityChecks,
        'Questions test understanding not memorization',
        'Explanations are educational and clear',
        'Wrong answers are plausible distractors',
        'Difficulty is appropriately balanced',
        'Questions cover key concepts comprehensively'
      ]
    };
  }
  
  private async generateQuizContent(prompts: GeneratedPrompts, context: TypeSpecificContext): Promise<any> {
    // Try to use real Azure OpenAI first
    if (this.aiService) {
      try {
        console.log('🧠 Using Azure OpenAI GPT-4o for quiz generation...');
        
        const messages = [
          { role: 'system' as const, content: prompts.systemPrompt },
          { role: 'user' as const, content: prompts.userPrompt }
        ];

        const aiContent = await this.aiService.generateJSON(messages);
        
        // Validate and enhance AI response
        const enhancedContent = this.enhanceQuizContent(aiContent, context);
        console.log('✅ AI quiz generated successfully');
        return enhancedContent;
        
      } catch (error) {
        console.error('❌ Quiz AI generation failed, falling back to mock:', error);
      }
    }

    // Fallback to mock quiz generation
    console.log('🔄 Using mock quiz generator...');
    const questionCount = context.difficulty === 'beginner' ? 5 : 
                         context.difficulty === 'intermediate' ? 8 : 10;
    
    return {
      title: `${this.extractTopicFromPrompt(context.userPrompt)} Assessment`,
      description: `Test your understanding of ${this.extractTopicFromPrompt(context.userPrompt).toLowerCase()}`,
      questions: this.generateMockQuestions(questionCount, context),
      passingScore: context.difficulty === 'beginner' ? 60 : 70,
      timeLimit: `${questionCount * 2} minutes`
    };
  }

  private enhanceQuizContent(aiContent: any, context: TypeSpecificContext): any {
    // Ensure all required fields are present and properly formatted
    const enhanced = {
      title: aiContent.title || `${this.extractTopicFromPrompt(context.userPrompt)} Assessment`,
      description: aiContent.description || `Test your understanding of ${this.extractTopicFromPrompt(context.userPrompt).toLowerCase()}`,
      questions: Array.isArray(aiContent.questions) ? aiContent.questions : this.generateMockQuestions(5, context),
      passingScore: aiContent.passingScore || (context.difficulty === 'beginner' ? 60 : 70),
      timeLimit: aiContent.timeLimit || `${(aiContent.questions?.length || 5) * 2} minutes`
    };

    // Validate questions structure
    enhanced.questions = enhanced.questions.map((question: any, index: number) => ({
      id: question.id || `q${index + 1}`,
      type: question.type || 'multiple-choice',
      question: question.question || `Question ${index + 1}`,
      options: Array.isArray(question.options) ? question.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: question.correctAnswer !== undefined ? question.correctAnswer : 0,
      explanation: question.explanation || 'Explanation provided by AI',
      difficulty: question.difficulty || 'medium',
      concepts: Array.isArray(question.concepts) ? question.concepts : ['general']
    }));

    return enhanced;
  }
  
  private generateMockQuestions(count: number, context: TypeSpecificContext): any[] {
    const questions = [];
    const topic = this.extractTopicFromPrompt(context.userPrompt);
    
    for (let i = 0; i < count; i++) {
      const difficulty = i < 2 ? 'easy' : i < count - 2 ? 'medium' : 'hard';
      const type = i % 3 === 0 ? 'multiple-choice' : i % 3 === 1 ? 'true-false' : 'short-answer';
      
      questions.push({
        id: `q${i + 1}`,
        type,
        question: `${topic} question ${i + 1} - ${difficulty} level`,
        ...(type === 'multiple-choice' ? {
          options: ['Correct answer', 'Wrong option 1', 'Wrong option 2', 'Wrong option 3'],
          correctAnswer: 0
        } : type === 'true-false' ? {
          correctAnswer: i % 2 === 0
        } : {
          correctAnswer: `Sample answer for ${topic}`
        }),
        explanation: `This tests your understanding of ${topic} concepts at ${difficulty} level`,
        difficulty,
        concepts: [topic.toLowerCase()]
      });
    }
    
    return questions;
  }
  
  private validateQuizContent(content: any, context: TypeSpecificContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Check question count
    const questionCount = content.questions?.length || 0;
    const expectedMin = context.difficulty === 'beginner' ? 3 : 5;
    
    if (questionCount >= expectedMin) {
      results.push({
        rule: 'question_count',
        passed: true,
        message: `Good question count: ${questionCount}`,
        severity: 'info'
      });
    } else {
      results.push({
        rule: 'question_count',
        passed: false,
        message: `Need at least ${expectedMin} questions for ${context.difficulty} level`,
        severity: 'error'
      });
    }
    
    // Check explanation quality
    const hasExplanations = content.questions?.every((q: any) => q.explanation && q.explanation.length > 20);
    results.push({
      rule: 'explanation_quality',
      passed: hasExplanations,
      message: hasExplanations ? 'All questions have detailed explanations' : 'Some questions lack proper explanations',
      severity: hasExplanations ? 'info' : 'warning'
    });
    
    return results;
  }
  
  private deriveQuizLearningObjectives(prompt: string): string[] {
    return [
      'Assess understanding of key concepts',
      'Identify knowledge gaps',
      'Reinforce learning through feedback'
    ];
  }
  
  private extractTopicFromPrompt(prompt: string): string {
    // Simple topic extraction
    const words = prompt.toLowerCase().split(' ');
    const topics = ['javascript', 'python', 'react', 'algorithms', 'data structures'];
    const found = topics.find(topic => words.includes(topic));
    return found ? found.charAt(0).toUpperCase() + found.slice(1) : 'Programming';
  }
  
  private analyzeQuestionTypes(questions: any[]): Record<string, number> {
    const types: Record<string, number> = {};
    questions.forEach(q => {
      types[q.type] = (types[q.type] || 0) + 1;
    });
    return types;
  }
  
  private analyzeDifficultyDistribution(questions: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    questions.forEach(q => {
      distribution[q.difficulty] = (distribution[q.difficulty] || 0) + 1;
    });
    return distribution;
  }
  
  private estimateQuizTime(questions: any[]): number {
    return questions.reduce((total, q) => {
      const baseTime = q.type === 'multiple-choice' ? 1.5 : 
                      q.type === 'true-false' ? 1 : 2.5;
      const difficultyMultiplier = q.difficulty === 'easy' ? 1 : 
                                  q.difficulty === 'medium' ? 1.3 : 1.6;
      return total + (baseTime * difficultyMultiplier);
    }, 0);
  }
  
  private analyzePedagogicalBalance(questions: any[]): Record<string, number> {
    let memorizationCount = 0;
    let applicationCount = 0;
    let analysisCount = 0;
    
    questions.forEach(q => {
      const question = q.question.toLowerCase();
      if (question.includes('what is') || question.includes('define')) {
        memorizationCount++;
      } else if (question.includes('how') || question.includes('implement')) {
        applicationCount++;
      } else {
        analysisCount++;
      }
    });
    
    return {
      memorization: memorizationCount,
      application: applicationCount,
      analysis: analysisCount
    };
  }
}

/**
 * Terminal Exercise Generator
 * 
 * Creates command-line learning experiences
 * with step-by-step terminal interactions.
 */
export class TerminalGenerator {
  private promptEngineer: PromptEngineer;
  private aiService: any; // Accept any compatible AI service
  
  constructor(aiService?: any) {
    this.promptEngineer = new PromptEngineer();
    if (aiService) {
      this.aiService = aiService;
    } else {
      try {
        this.aiService = createAIService();
      } catch (error) {
        console.warn('AI Service initialization failed, using fallback mode:', error);
        this.aiService = null;
      }
    }
  }
  
  async generate(context: TypeSpecificContext): Promise<GeneratedContent> {
    console.log(`⚡ Generating terminal exercise: ${context.difficulty} level`);
    
    const promptContext: PromptContext = {
      ...context,
      capsuleType: 'terminal',
      learningObjectives: ['Master command-line skills', 'Understand system administration', 'Practice DevOps workflows']
    };
    
    const prompts = this.generateTerminalPrompts(promptContext);
    const content = await this.generateTerminalContent(prompts, context);
    const validationResults = this.validateTerminalContent(content, context);
    
    return {
      content,
      prompts,
      validationResults,
      typeSpecificMetadata: {
        commandComplexity: this.analyzeCommandComplexity(content.steps),
        safetyLevel: this.analyzeSafetyLevel(content.steps),
        progressiveComplexity: this.analyzeProgressiveComplexity(content.steps)
      }
    };
  }
  
  private generateTerminalPrompts(context: PromptContext): GeneratedPrompts {
    const basePrompts = this.promptEngineer.generatePrompts(context);
    
    const terminalSpecificInstructions = `
⚡ TERMINAL EXERCISE REQUIREMENTS:

STRUCTURE YOUR RESPONSE AS:
{
  "title": "Hands-on terminal exercise title",
  "description": "What learners will accomplish",
  "environment": {
    "os": "ubuntu:20.04",
    "workingDirectory": "/home/learner",
    "preInstalledTools": ["git", "npm", "curl"]
  },
  "steps": [
    {
      "id": 1,
      "instruction": "Clear explanation of what to do",
      "command": "actual command to run",
      "expectedOutput": "what should appear in terminal",
      "explanation": "why this command works",
      "troubleshooting": "common issues and fixes"
    }
  ],
  "verification": {
    "finalCommand": "command to verify completion",
    "successIndicators": ["what to look for when successful"]
  }
}

SAFETY AND PEDAGOGY:
- Start with safe, reversible commands
- Explain each command before showing it
- Include error handling and troubleshooting
- Progressive complexity from basic to advanced
- Always explain WHY not just HOW
- Include shortcuts and best practices
`;
    
    return {
      ...basePrompts,
      systemPrompt: basePrompts.systemPrompt + terminalSpecificInstructions,
      qualityChecks: [
        ...basePrompts.qualityChecks,
        'Commands are safe and reversible',
        'Each step is clearly explained',
        'Includes troubleshooting guidance',
        'Progressive complexity is maintained',
        'Final verification step is included'
      ]
    };
  }
  
  private async generateTerminalContent(prompts: GeneratedPrompts, context: TypeSpecificContext): Promise<any> {
    // Try to use real Azure OpenAI first
    if (this.aiService) {
      try {
        console.log('⚡ Using Azure OpenAI GPT-4o for terminal exercise generation...');
        
        const messages = [
          { role: 'system' as const, content: prompts.systemPrompt },
          { role: 'user' as const, content: prompts.userPrompt }
        ];

        const aiContent = await this.aiService.generateJSON(messages);
        
        // Validate and enhance AI response
        const enhancedContent = this.enhanceTerminalContent(aiContent, context);
        console.log('✅ AI terminal exercise generated successfully');
        return enhancedContent;
        
      } catch (error) {
        console.error('❌ Terminal AI generation failed, falling back to mock:', error);
      }
    }

    // Fallback to mock terminal exercise generation
    console.log('🔄 Using mock terminal generator...');
    return {
      title: `Command Line: ${this.extractTerminalTopic(context.userPrompt)}`,
      description: `Learn ${this.extractTerminalTopic(context.userPrompt).toLowerCase()} through hands-on terminal practice`,
      environment: {
        os: 'ubuntu:20.04',
        workingDirectory: '/home/learner',
        preInstalledTools: ['git', 'npm', 'curl', 'vim']
      },
      steps: this.generateTerminalSteps(context),
      verification: {
        finalCommand: 'ls -la',
        successIndicators: ['Files are created', 'Permissions are correct']
      }
    };
  }

  private enhanceTerminalContent(aiContent: any, context: TypeSpecificContext): any {
    // Ensure all required fields are present and properly formatted
    const enhanced = {
      title: aiContent.title || `Command Line: ${this.extractTerminalTopic(context.userPrompt)}`,
      description: aiContent.description || `Learn ${this.extractTerminalTopic(context.userPrompt).toLowerCase()} through hands-on terminal practice`,
      environment: {
        os: aiContent.environment?.os || 'ubuntu:20.04',
        workingDirectory: aiContent.environment?.workingDirectory || '/home/learner',
        preInstalledTools: Array.isArray(aiContent.environment?.preInstalledTools) ? 
          aiContent.environment.preInstalledTools : ['git', 'npm', 'curl', 'vim']
      },
      steps: Array.isArray(aiContent.steps) ? aiContent.steps : this.generateTerminalSteps(context),
      verification: aiContent.verification || {
        finalCommand: 'ls -la',
        successIndicators: ['Files are created', 'Permissions are correct']
      }
    };

    // Validate steps structure
    enhanced.steps = enhanced.steps.map((step: any, index: number) => ({
      id: step.id || index + 1,
      instruction: step.instruction || `Step ${index + 1}`,
      command: step.command || 'echo "command placeholder"',
      expectedOutput: step.expectedOutput || step.output || 'Expected output',
      explanation: step.explanation || 'Step explanation',
      troubleshooting: step.troubleshooting || 'Check command syntax if errors occur'
    }));

    return enhanced;
  }
  
  private generateTerminalSteps(context: TypeSpecificContext): any[] {
    const topic = this.extractTerminalTopic(context.userPrompt);
    const stepCount = context.difficulty === 'beginner' ? 5 : 
                     context.difficulty === 'intermediate' ? 8 : 12;
    
    const steps = [];
    
    for (let i = 0; i < stepCount; i++) {
      steps.push({
        id: i + 1,
        instruction: `Step ${i + 1}: ${topic} operation`,
        command: this.generateStepCommand(i, topic, context.difficulty),
        expectedOutput: `Expected output for step ${i + 1}`,
        explanation: `This command helps you understand ${topic}`,
        troubleshooting: 'If you see an error, check the command syntax'
      });
    }
    
    return steps;
  }
  
  private generateStepCommand(step: number, topic: string, difficulty: DifficultyLevel): string {
    const commands = {
      beginner: ['ls', 'pwd', 'mkdir test', 'cd test', 'touch file.txt'],
      intermediate: ['git init', 'git add .', 'npm init -y', 'curl -O url', 'grep pattern file'],
      advanced: ['docker run ubuntu', 'ssh user@host', 'awk "{print $1}" file', 'find . -name "*.js"', 'tar -czf archive.tar.gz .']
    };
    
    return commands[difficulty][step % commands[difficulty].length];
  }
  
  private validateTerminalContent(content: any, context: TypeSpecificContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Check command safety
    const dangerousCommands = ['rm -rf', 'sudo rm', 'format', 'del /s'];
    const hasDangerousCommands = content.steps?.some((step: any) => 
      dangerousCommands.some(cmd => step.command?.includes(cmd))
    );
    
    results.push({
      rule: 'command_safety',
      passed: !hasDangerousCommands,
      message: hasDangerousCommands ? 'Contains potentially dangerous commands' : 'All commands are safe',
      severity: hasDangerousCommands ? 'error' : 'info'
    });
    
    return results;
  }
  
  private extractTerminalTopic(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('git')) return 'Git';
    if (lower.includes('docker')) return 'Docker';
    if (lower.includes('npm')) return 'NPM';
    if (lower.includes('file')) return 'File Management';
    return 'Command Line';
  }
  
  private analyzeCommandComplexity(steps: any[]): number {
    return steps.reduce((total, step) => {
      const command = step.command || '';
      let complexity = 1;
      complexity += (command.match(/\|/g) || []).length; // pipes
      complexity += (command.match(/&&|\|\|/g) || []).length; // logical operators
      complexity += (command.match(/>/g) || []).length; // redirects
      return total + complexity;
    }, 0) / steps.length;
  }
  
  private analyzeSafetyLevel(steps: any[]): 'safe' | 'moderate' | 'dangerous' {
    const dangerousPatterns = ['rm -rf', 'sudo rm', 'format'];
    const moderatePatterns = ['sudo', 'chmod 777', 'rm '];
    
    const hasDangerous = steps.some(step => 
      dangerousPatterns.some(pattern => step.command?.includes(pattern))
    );
    
    const hasModerate = steps.some(step =>
      moderatePatterns.some(pattern => step.command?.includes(pattern))
    );
    
    return hasDangerous ? 'dangerous' : hasModerate ? 'moderate' : 'safe';
  }
  
  private analyzeProgressiveComplexity(steps: any[]): boolean {
    // Check if commands get progressively more complex
    const complexities = steps.map(step => this.analyzeCommandComplexity([step]));
    
    for (let i = 1; i < complexities.length; i++) {
      if (complexities[i] < complexities[i - 1] - 0.5) {
        return false; // Complexity decreased significantly
      }
    }
    
    return true;
  }
}

/**
 * Universal Type-Specific Generator Factory
 */
export class TypeSpecificGeneratorFactory {
  
  static createGenerator(type: CapsuleType) {
    switch (type) {
      case 'code':
        return new CodeChallengeGenerator();
      case 'quiz':
        return new QuizGenerator();
      case 'terminal':
        return new TerminalGenerator();
      default:
        throw new Error(`Unsupported capsule type: ${type}`);
    }
  }
  
  static async generateContent(context: TypeSpecificContext): Promise<GeneratedContent> {
    const generator = this.createGenerator(context.type);
    return await generator.generate(context);
  }
  
  static validateContext(context: TypeSpecificContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    if (!context.userPrompt || context.userPrompt.trim().length < 10) {
      results.push({
        rule: 'prompt_length',
        passed: false,
        message: 'User prompt is too short for meaningful content generation',
        severity: 'error'
      });
    }
    
    if (!context.runtimeTarget || !['wasm', 'docker', 'hybrid'].includes(context.runtimeTarget)) {
      results.push({
        rule: 'runtime_target',
        passed: false,
        message: 'Invalid runtime target specified',
        severity: 'error'
      });
    }
    
    return results;
  }
}

/**
 * Database Generator
 * 
 * Creates SQL/NoSQL database exercises with
 * queries, schema design, and data manipulation.
 */
export class DatabaseGenerator {
  private promptEngineer: PromptEngineer;
  private aiService: any; // Accept any compatible AI service
  
  constructor(aiService?: any) {
    this.promptEngineer = new PromptEngineer();
    if (aiService) {
      this.aiService = aiService;
    } else {
      try {
        this.aiService = createAIService();
      } catch (error) {
        console.warn('AI Service initialization failed, using fallback mode:', error);
        this.aiService = null;
      }
    }
  }

  async generate(context: TypeSpecificContext): Promise<GeneratedContent> {
    console.log(`🗄️ Generating database exercise: ${context.difficulty} level`);
    
    const promptContext: PromptContext = {
      ...context,
      capsuleType: 'database',
      learningObjectives: ['Master database queries', 'Understand data modeling', 'Practice database design']
    };
    
    const prompts = this.generateDatabasePrompts(promptContext);
    const content = await this.generateDatabaseContent(prompts, context);
    const validationResults = this.validateDatabaseContent(content, context);
    
    return {
      content,
      prompts,
      validationResults,
      typeSpecificMetadata: {
        queryComplexity: this.analyzeQueryComplexity(content.queries || []),
        schemaComplexity: this.analyzeSchemaComplexity(content.schema || {}),
        dataIntegrity: this.analyzeDataIntegrity(content)
      }
    };
  }

  private generateDatabasePrompts(context: PromptContext): GeneratedPrompts {
    const basePrompts = this.promptEngineer.generatePrompts(context);
    
    const databaseSpecificInstructions = `
🗄️ DATABASE EXERCISE REQUIREMENTS:

IMPORTANT: Create a clean, engaging problem statement. DO NOT include the generation instructions or requirements from the user prompt in your response. Transform the user's request into a proper learning exercise.

STRUCTURE YOUR RESPONSE AS:
{
  "title": "Database exercise title",
  "description": "Clean problem statement explaining the scenario and task for learners (NOT the generation requirements)",
  "databaseType": "postgresql",
  "schema": {
    "tables": [
      {
        "name": "users",
        "columns": [
          {"name": "id", "type": "serial", "constraints": ["PRIMARY KEY"]},
          {"name": "email", "type": "varchar(255)", "constraints": ["UNIQUE", "NOT NULL"]}
        ]
      }
    ]
  },
  "sampleData": [
    {
      "table": "users",
      "data": [
        {"id": 1, "email": "user@example.com"}
      ]
    }
  ],
  "queries": [
    {
      "id": "q1",
      "task": "Select all users",
      "starterQuery": "SELECT * FROM users WHERE -- Complete this query",
      "solutionQuery": "SELECT * FROM users;",
      "explanation": "This basic SELECT retrieves all user records",
      "difficulty": "easy"
    }
  ],
  "verification": {
    "testQueries": ["SELECT COUNT(*) FROM users;"],
    "expectedResults": [{"count": 1}]
  }
}

PEDAGOGICAL REQUIREMENTS:
- Start with simple SELECT queries
- Progress to JOINs, subqueries, and complex operations
- Include data modeling concepts
- Provide realistic sample data
- Explain query performance implications
`;
    
    return {
      ...basePrompts,
      systemPrompt: basePrompts.systemPrompt + databaseSpecificInstructions,
      qualityChecks: [
        ...basePrompts.qualityChecks,
        'Schema is well-designed and normalized',
        'Sample data is realistic and comprehensive',
        'Queries progress from simple to complex',
        'Explanations cover performance considerations',
        'Verification queries test understanding'
      ]
    };
  }

  private async generateDatabaseContent(prompts: GeneratedPrompts, context: TypeSpecificContext): Promise<any> {
    // Try to use real Azure OpenAI first
    if (this.aiService) {
      try {
        console.log('🗄️ Using Azure OpenAI GPT-4o for database exercise generation...');
        
        const messages = [
          { role: 'system' as const, content: prompts.systemPrompt },
          { role: 'user' as const, content: prompts.userPrompt }
        ];

        const aiContent = await this.aiService.generateJSON(messages);
        
        // Validate and enhance AI response
        const enhancedContent = this.enhanceDatabaseContent(aiContent, context);
        console.log('✅ AI database exercise generated successfully');
        return enhancedContent;
        
      } catch (error) {
        console.error('❌ Database AI generation failed, falling back to mock:', error);
      }
    }

    // Fallback to mock database exercise generation
    console.log('🔄 Using mock database generator...');
    return {
      title: `Database: ${this.extractDatabaseTopic(context.userPrompt)}`,
      description: `Master ${this.extractDatabaseTopic(context.userPrompt).toLowerCase()} with hands-on SQL practice`,
      databaseType: 'postgresql',
      schema: this.generateMockSchema(context),
      sampleData: this.generateMockData(context),
      queries: this.generateMockQueries(context),
      verification: {
        testQueries: ['SELECT COUNT(*) FROM users;'],
        expectedResults: [{ count: 3 }]
      }
    };
  }

  private enhanceDatabaseContent(aiContent: any, context: TypeSpecificContext): any {
    return {
      title: aiContent.title || `Database: ${this.extractDatabaseTopic(context.userPrompt)}`,
      description: aiContent.description || `Master ${this.extractDatabaseTopic(context.userPrompt).toLowerCase()} with hands-on SQL practice`,
      databaseType: aiContent.databaseType || 'postgresql',
      schema: aiContent.schema || this.generateMockSchema(context),
      sampleData: Array.isArray(aiContent.sampleData) ? aiContent.sampleData : this.generateMockData(context),
      queries: Array.isArray(aiContent.queries) ? aiContent.queries : this.generateMockQueries(context),
      verification: aiContent.verification || {
        testQueries: ['SELECT COUNT(*) FROM users;'],
        expectedResults: [{ count: 3 }]
      }
    };
  }

  private generateMockSchema(context: TypeSpecificContext): any {
    return {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'serial', constraints: ['PRIMARY KEY'] },
            { name: 'email', type: 'varchar(255)', constraints: ['UNIQUE', 'NOT NULL'] },
            { name: 'created_at', type: 'timestamp', constraints: ['DEFAULT CURRENT_TIMESTAMP'] }
          ]
        }
      ]
    };
  }

  private generateMockData(context: TypeSpecificContext): any[] {
    return [
      {
        table: 'users',
        data: [
          { id: 1, email: 'alice@example.com', created_at: '2024-01-01T10:00:00Z' },
          { id: 2, email: 'bob@example.com', created_at: '2024-01-02T11:00:00Z' },
          { id: 3, email: 'charlie@example.com', created_at: '2024-01-03T12:00:00Z' }
        ]
      }
    ];
  }

  private generateMockQueries(context: TypeSpecificContext): any[] {
    return [
      {
        id: 'q1',
        task: 'Select all users',
        starterQuery: 'SELECT * FROM users WHERE -- Complete this query',
        solutionQuery: 'SELECT * FROM users;',
        explanation: 'This basic SELECT retrieves all user records',
        difficulty: 'easy'
      },
      {
        id: 'q2', 
        task: 'Find users by email domain',
        starterQuery: 'SELECT * FROM users WHERE email LIKE -- Complete this condition',
        solutionQuery: "SELECT * FROM users WHERE email LIKE '%@example.com';",
        explanation: 'LIKE with wildcards helps pattern matching in text fields',
        difficulty: 'medium'
      }
    ];
  }

  private extractDatabaseTopic(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('join')) return 'SQL Joins';
    if (lower.includes('aggregate')) return 'Aggregation Functions';
    if (lower.includes('index')) return 'Database Indexing';
    if (lower.includes('transaction')) return 'Transactions';
    return 'SQL Fundamentals';
  }

  private validateDatabaseContent(content: any, context: TypeSpecificContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Validate schema
    if (content.schema?.tables?.length > 0) {
      results.push({
        rule: 'schema_present',
        passed: true,
        message: 'Database schema is properly defined',
        severity: 'info'
      });
    } else {
      results.push({
        rule: 'schema_present',
        passed: false,
        message: 'Database schema is missing or invalid',
        severity: 'error'
      });
    }

    // Validate queries
    const queryCount = content.queries?.length || 0;
    const minQueries = context.difficulty === 'beginner' ? 2 : 4;
    
    results.push({
      rule: 'query_count',
      passed: queryCount >= minQueries,
      message: `Query count: ${queryCount}/${minQueries} minimum`,
      severity: queryCount >= minQueries ? 'info' : 'warning'
    });

    return results;
  }

  private analyzeQueryComplexity(queries: any[]): number {
    return queries.reduce((complexity, query) => {
      const sql = query.solutionQuery?.toLowerCase() || '';
      let score = 1;
      if (sql.includes('join')) score += 2;
      if (sql.includes('group by')) score += 1;
      if (sql.includes('having')) score += 1;
      if (sql.includes('subquery') || sql.includes('(select')) score += 2;
      return complexity + score;
    }, 0) / Math.max(queries.length, 1);
  }

  private analyzeSchemaComplexity(schema: any): number {
    const tableCount = schema.tables?.length || 0;
    const totalColumns = schema.tables?.reduce((sum: number, table: any) => 
      sum + (table.columns?.length || 0), 0) || 0;
    return tableCount + (totalColumns * 0.2);
  }

  private analyzeDataIntegrity(content: any): number {
    let score = 5; // Base score
    
    // Check for foreign key relationships
    const hasForeignKeys = content.schema?.tables?.some((table: any) =>
      table.columns?.some((col: any) => 
        col.constraints?.includes('FOREIGN KEY')
      )
    );
    if (hasForeignKeys) score += 2;
    
    // Check for proper constraints
    const hasConstraints = content.schema?.tables?.some((table: any) =>
      table.columns?.some((col: any) => 
        col.constraints?.length > 0
      )
    );
    if (hasConstraints) score += 3;
    
    return Math.min(score, 10);
  }
}

