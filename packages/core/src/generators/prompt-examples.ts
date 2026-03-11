/**
 * Prompt Engineering Examples
 * 
 * This demonstrates how the prompt engineering system adapts
 * to different runtime targets, difficulty levels, and user feedback.
 */

import { PromptEngineer, PromptUtils } from './prompt-engineer';
import type { PromptContext } from './prompt-engineer';

/**
 * Example 1: Free Tier WASM Prompt
 * 
 * Simple, constrained environment for beginners
 */
export const generateFreeTierPrompt = () => {
  const engineer = new PromptEngineer();
  
  const context: PromptContext = {
    runtimeTarget: 'wasm',
    constraints: {
      target: 'wasm',
      wasmLimitations: {
        noFileSystem: true,
        noNetworking: true,
        memoryLimit: 32,
        executionTimeLimit: 3000,
        allowedLanguages: ['javascript'],
        maxCodeComplexity: 5
      }
    },
    capsuleType: 'code',
    difficulty: 'beginner',
    userPrompt: "Create a function to check if a number is prime",
  };
  
  const prompts = engineer.generatePrompts(context);
  
  console.log('🆓 FREE TIER WASM PROMPT:');
  console.log('==========================');
  console.log('System Prompt Length:', prompts.systemPrompt.length);
  console.log('Focuses on:', 'Simple algorithms, no I/O, memory-constrained');
  console.log('Target Audience:', 'Beginners learning fundamentals');
  
  return prompts;
};

/**
 * Example 2: Pro Tier Docker Prompt
 * 
 * Full-featured environment for advanced projects
 */
export const generateProTierPrompt = () => {
  const engineer = new PromptEngineer();
  
  const context: PromptContext = {
    runtimeTarget: 'docker',
    constraints: {
      target: 'docker',
      dockerCapabilities: {
        fileSystemAccess: true,
        networkAccess: true,
        databaseAccess: true,
        externalAPIAccess: true,
        multiFileProjects: true,
        customDependencies: true,
        unlimitedExecution: false
      }
    },
    capsuleType: 'code',
    difficulty: 'advanced',
    userPrompt: "Build a microservice that processes user authentication with JWT tokens and rate limiting",
  };
  
  const prompts = engineer.generatePrompts(context);
  
  console.log('💰 PRO TIER DOCKER PROMPT:');
  console.log('===========================');
  console.log('System Prompt Length:', prompts.systemPrompt.length);
  console.log('Focuses on:', 'Full-stack, production-ready, scalable solutions');
  console.log('Target Audience:', 'Advanced developers building real systems');
  
  return prompts;
};

/**
 * Example 3: Educational Quiz with Feedback
 * 
 * Learning assessment with creator feedback integration
 */
export const generateEducationalQuizPrompt = () => {
  const engineer = new PromptEngineer();
  
  // Simulate previous creator feedback
  const mockFeedback = [
    {
      id: 'feedback-1',
      capsuleId: 'capsule-123',
      creatorId: 'educator-456',
      timestamp: new Date(),
      fieldType: 'problem_statement' as const,
      aiGenerated: "What is a variable?",
      humanEdited: "What is a variable and why do we use them in programming?",
      editType: 'content_improvement' as const,
      context: {
        originalPrompt: "Create quiz about variables",
        generationModel: 'gpt-4o',
        generationParams: {},
        creatorExperience: 'expert' as const,
        timeSpentEditing: 5000,
        capsuleType: 'quiz',
        targetDifficulty: 'beginner',
        targetAudience: 'computer science students'
      },
      signals: {
        editImmediacy: 2000,
        editExtensiveness: 0.3,
        subsequentRegenerations: 0
      }
    }
  ];
  
  const context: PromptContext = {
    runtimeTarget: 'hybrid',
    constraints: {
      target: 'hybrid',
      wasmLimitations: {
        noFileSystem: true,
        noNetworking: true,
        memoryLimit: 64,
        executionTimeLimit: 5000,
        allowedLanguages: ['javascript', 'python'],
        maxCodeComplexity: 6
      },
      dockerCapabilities: {
        fileSystemAccess: true,
        networkAccess: false,
        databaseAccess: false,
        externalAPIAccess: false,
        multiFileProjects: true,
        customDependencies: true,
        unlimitedExecution: false
      }
    },
    capsuleType: 'quiz',
    difficulty: 'intermediate',
    userPrompt: "Create an interactive quiz about JavaScript closures with practical examples",
    creatorFeedback: mockFeedback,
  };
  
  const prompts = engineer.generatePrompts(context);
  
  console.log('🎓 EDUCATIONAL QUIZ WITH FEEDBACK:');
  console.log('==================================');
  console.log('System Prompt Length:', prompts.systemPrompt.length);
  console.log('Feedback Integrated:', context.creatorFeedback?.length || 0, 'instances');
  console.log('Focus:', 'Interactive assessment with creator-enhanced questions');
  
  return prompts;
};

/**
 * Example 4: Terminal Capsule for DevOps
 * 
 * Command-line learning experience
 */
export const generateTerminalPrompt = () => {
  const engineer = new PromptEngineer();
  
  const context: PromptContext = {
    runtimeTarget: 'docker',
    constraints: {
      target: 'docker',
      dockerCapabilities: {
        fileSystemAccess: true,
        networkAccess: true,
        databaseAccess: false,
        externalAPIAccess: true,
        multiFileProjects: true,
        customDependencies: true,
        unlimitedExecution: false
      }
    },
    capsuleType: 'terminal',
    difficulty: 'intermediate',
    userPrompt: "Teach Docker container management through hands-on CLI exercises",
  };
  
  const prompts = engineer.generatePrompts(context);
  
  console.log('⚡ TERMINAL DEVOPS LEARNING:');
  console.log('===========================');
  console.log('System Prompt Length:', prompts.systemPrompt.length);
  console.log('Focus:', 'Hands-on command-line learning');
  console.log('Environment:', 'Full Docker access for realistic scenarios');
  
  return prompts;
};

/**
 * Comprehensive prompt engineering demo
 */
export const runPromptEngineeringDemo = () => {
  console.log('🎯 PROMPT ENGINEERING SYSTEM DEMO');
  console.log('=====================================\\n');
  
  // Generate different prompt types
  const freeTier = generateFreeTierPrompt();
  const proTier = generateProTierPrompt();
  const educational = generateEducationalQuizPrompt();
  const terminal = generateTerminalPrompt();
  
  console.log('\\n📊 PROMPT ANALYSIS:');
  console.log('====================');
  
  // Analyze each prompt type
  const prompts = [
    { name: 'Free Tier', prompts: freeTier },
    { name: 'Pro Tier', prompts: proTier },
    { name: 'Educational', prompts: educational },
    { name: 'Terminal', prompts: terminal }
  ];
  
  prompts.forEach(({ name, prompts }) => {
    const validation = PromptUtils.validatePrompts(prompts);
    const tokens = PromptUtils.estimateTokens(prompts);
    
    console.log(`\\n${name}:`);
    console.log(`  System Prompt: ${prompts.systemPrompt.length} chars (~${tokens.systemTokens} tokens)`);
    console.log(`  User Prompt: ${prompts.userPrompt.length} chars (~${tokens.userTokens} tokens)`);
    console.log(`  Quality Checks: ${prompts.qualityChecks.length}`);
    console.log(`  Valid: ${validation.isValid ? '✅' : '❌'}`);
    console.log(`  Issues: ${validation.issues.length}`);
  });
  
  console.log('\\n🏰 COMPETITIVE ADVANTAGES:');
  console.log('===========================');
  console.log('✓ Runtime-aware prompt adaptation');
  console.log('✓ Difficulty-based content scaling');
  console.log('✓ Creator feedback integration');
  console.log('✓ Type-specific generation guidance');
  console.log('✓ Quality validation and token optimization');
  console.log('✓ Pedagogical best practices built-in');
  
  console.log('\\n💡 BUSINESS IMPACT:');
  console.log('===================');
  console.log('• Free tier users get simple, constrained content (drives upgrades)');
  console.log('• Pro tier users get complex, full-featured content (justifies pricing)');
  console.log('• Educational institutions get feedback-enhanced content (B2B value)');
  console.log('• All content follows pedagogical minimalism (brand differentiation)');
  
  return {
    freeTier,
    proTier,
    educational,
    terminal,
    summary: {
      totalPrompts: prompts.length,
      avgSystemPromptLength: prompts.reduce((sum, p) => sum + p.prompts.systemPrompt.length, 0) / prompts.length,
      avgQualityChecks: prompts.reduce((sum, p) => sum + p.prompts.qualityChecks.length, 0) / prompts.length
    }
  };
};

/**
 * Debug a specific prompt engineering scenario
 */
export const debugPromptEngineering = (context: PromptContext) => {
  const engineer = new PromptEngineer();
  const prompts = engineer.generatePrompts(context);
  
  console.log('🔍 PROMPT ENGINEERING DEBUG:');
  console.log('=============================');
  
  const debugSummary = PromptUtils.generateDebugSummary(context, prompts);
  console.log(debugSummary);
  
  console.log('\\n📝 GENERATED SYSTEM PROMPT:');
  console.log('============================');
  console.log(prompts.systemPrompt.substring(0, 500) + '...');
  
  console.log('\\n🎯 QUALITY CHECKS:');
  console.log('==================');
  prompts.qualityChecks.forEach((check, i) => {
    console.log(`${i + 1}. ${check}`);
  });
  
  console.log('\\n📋 ADAPTATION NOTES:');
  console.log('====================');
  prompts.adaptationNotes.forEach((note, i) => {
    console.log(`${i + 1}. ${note}`);
  });
  
  return prompts;
};

// Export all examples
export {
  PromptEngineer,
  PromptUtils
};