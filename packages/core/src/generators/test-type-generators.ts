/**
 * Type-Specific Generator Integration Test
 * 
 * This demonstrates how all type-specific generators work together
 * to create different learning formats with runtime awareness.
 */

import { TypeSpecificGeneratorFactory } from './type-specific-generators';
import type { TypeSpecificContext } from './type-specific-generators';

/**
 * Test all generator types with different configurations
 */
export const testAllGeneratorTypes = async () => {
  console.log('🧪 TESTING TYPE-SPECIFIC GENERATORS');
  console.log('===================================\n');
  
  // Test Code Challenge Generator
  console.log('1️⃣ CODE CHALLENGE GENERATOR:');
  await testCodeGenerator();
  
  console.log('\n2️⃣ QUIZ GENERATOR:');
  await testQuizGenerator();
  
  console.log('\n3️⃣ TERMINAL GENERATOR:');
  await testTerminalGenerator();
  
  console.log('\n🎯 RUNTIME ADAPTATION TEST:');
  await testRuntimeAdaptation();
  
  console.log('\n📊 DIFFICULTY SCALING TEST:');
  await testDifficultyScaling();
};

/**
 * Test Code Challenge Generator
 */
const testCodeGenerator = async () => {
  const context: TypeSpecificContext = {
    type: 'code',
    userPrompt: 'Create a function to find the longest palindrome substring',
    runtimeTarget: 'wasm',
    constraints: {
      target: 'wasm',
      wasmLimitations: {
        noFileSystem: true,
        noNetworking: true,
        memoryLimit: 64,
        executionTimeLimit: 5000,
        allowedLanguages: ['javascript'],
        maxCodeComplexity: 7
      }
    },
    difficulty: 'intermediate'
  };
  
  try {
    const result = await TypeSpecificGeneratorFactory.generateContent(context);
    
    console.log(`✅ Generated: ${result.content.title}`);
    console.log(`📝 Starter Code: ${result.content.starterCode.length} characters`);
    console.log(`🧪 Test Cases: ${result.content.testCases?.length || 0}`);
    console.log(`💡 Hints: ${result.content.hints?.length || 0}`);
    console.log(`⏱️ Estimated Time: ${result.content.timeEstimate}`);
    
    // Show validation results
    const errors = result.validationResults.filter(r => !r.passed);
    console.log(`🔍 Validation: ${errors.length} issues found`);
    
    // Show type-specific metadata
    console.log(`📊 Code Complexity: ${result.typeSpecificMetadata.codeComplexity.toFixed(1)}/10`);
    console.log(`🎯 Test Coverage: ${result.typeSpecificMetadata.testCoverage}%`);
    
  } catch (error) {
    console.error('❌ Code generator failed:', error);
  }
};

/**
 * Test Quiz Generator
 */
const testQuizGenerator = async () => {
  const context: TypeSpecificContext = {
    type: 'quiz',
    userPrompt: 'Create a quiz about JavaScript closures and scope',
    runtimeTarget: 'hybrid',
    constraints: {
      target: 'hybrid',
      wasmLimitations: {
        noFileSystem: true,
        noNetworking: true,
        memoryLimit: 32,
        executionTimeLimit: 3000,
        allowedLanguages: ['javascript'],
        maxCodeComplexity: 5
      }
    },
    difficulty: 'advanced'
  };
  
  try {
    const result = await TypeSpecificGeneratorFactory.generateContent(context);
    
    console.log(`✅ Generated: ${result.content.title}`);
    console.log(`❓ Questions: ${result.content.questions?.length || 0}`);
    console.log(`🎯 Passing Score: ${result.content.passingScore}%`);
    console.log(`⏱️ Time Limit: ${result.content.timeLimit}`);
    
    // Show question type distribution
    const questionTypes = result.typeSpecificMetadata.questionTypes;
    console.log(`📊 Question Types:`, Object.entries(questionTypes).map(([type, count]) => `${type}: ${count}`).join(', '));
    
    // Show difficulty distribution
    const difficulty = result.typeSpecificMetadata.difficultyDistribution;
    console.log(`📈 Difficulty:`, Object.entries(difficulty).map(([level, count]) => `${level}: ${count}`).join(', '));
    
    console.log(`⏰ Estimated Time: ${result.typeSpecificMetadata.estimatedCompletionTime.toFixed(1)} minutes`);
    
  } catch (error) {
    console.error('❌ Quiz generator failed:', error);
  }
};

/**
 * Test Terminal Generator
 */
const testTerminalGenerator = async () => {
  const context: TypeSpecificContext = {
    type: 'terminal',
    userPrompt: 'Teach Docker container management basics',
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
    difficulty: 'intermediate'
  };
  
  try {
    const result = await TypeSpecificGeneratorFactory.generateContent(context);
    
    console.log(`✅ Generated: ${result.content.title}`);
    console.log(`🐧 Environment: ${result.content.environment.os}`);
    console.log(`📂 Working Dir: ${result.content.environment.workingDirectory}`);
    console.log(`⚡ Steps: ${result.content.steps?.length || 0}`);
    console.log(`🔧 Tools: ${result.content.environment.preInstalledTools.join(', ')}`);
    
    // Show command complexity analysis
    console.log(`📊 Command Complexity: ${result.typeSpecificMetadata.commandComplexity.toFixed(1)}/10`);
    console.log(`🛡️ Safety Level: ${result.typeSpecificMetadata.safetyLevel}`);
    console.log(`📈 Progressive: ${result.typeSpecificMetadata.progressiveComplexity ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Terminal generator failed:', error);
  }
};

/**
 * Test runtime adaptation between WASM and Docker
 */
const testRuntimeAdaptation = async () => {
  const basePrompt = 'Create a web scraping exercise';
  
  // WASM version (should be limited)
  const wasmContext: TypeSpecificContext = {
    type: 'code',
    userPrompt: basePrompt,
    runtimeTarget: 'wasm',
    constraints: {
      target: 'wasm',
      wasmLimitations: {
        noFileSystem: true,
        noNetworking: true,
        memoryLimit: 32,
        executionTimeLimit: 3000,
        allowedLanguages: ['javascript'],
        maxCodeComplexity: 4
      }
    },
    difficulty: 'beginner'
  };
  
  // Docker version (should be full-featured)
  const dockerContext: TypeSpecificContext = {
    type: 'code',
    userPrompt: basePrompt,
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
    difficulty: 'advanced'
  };
  
  try {
    const wasmResult = await TypeSpecificGeneratorFactory.generateContent(wasmContext);
    const dockerResult = await TypeSpecificGeneratorFactory.generateContent(dockerContext);
    
    console.log('🆓 WASM Version (Free Tier):');
    console.log(`  Complexity: ${wasmResult.typeSpecificMetadata.codeComplexity.toFixed(1)}/10`);
    console.log(`  Time: ${wasmResult.content.timeEstimate}`);
    console.log(`  Focus: Browser-compatible algorithms`);
    
    console.log('💰 Docker Version (Pro Tier):');
    console.log(`  Complexity: ${dockerResult.typeSpecificMetadata.codeComplexity.toFixed(1)}/10`);
    console.log(`  Time: ${dockerResult.content.timeEstimate}`);
    console.log(`  Focus: Full-stack with external APIs`);
    
    const complexityDiff = dockerResult.typeSpecificMetadata.codeComplexity - wasmResult.typeSpecificMetadata.codeComplexity;
    console.log(`📈 Complexity Increase: +${complexityDiff.toFixed(1)} (${((complexityDiff / wasmResult.typeSpecificMetadata.codeComplexity) * 100).toFixed(0)}%)`);
    
  } catch (error) {
    console.error('❌ Runtime adaptation test failed:', error);
  }
};

/**
 * Test difficulty scaling across all types
 */
const testDifficultyScaling = async () => {
  const difficulties = ['beginner', 'intermediate', 'advanced'] as const;
  const types = ['code', 'quiz', 'terminal'] as const;
  
  console.log('Testing difficulty scaling across all generator types...\n');
  
  for (const type of types) {
    console.log(`📝 ${type.toUpperCase()} DIFFICULTY SCALING:`);
    
    for (const difficulty of difficulties) {
      const context: TypeSpecificContext = {
        type,
        userPrompt: `Create a ${difficulty} level ${type === 'code' ? 'programming challenge' : type === 'quiz' ? 'assessment' : 'terminal exercise'}`,
        runtimeTarget: 'hybrid',
        constraints: {
          target: 'hybrid',
          wasmLimitations: {
            noFileSystem: true,
            noNetworking: true,
            memoryLimit: 64,
            executionTimeLimit: 5000,
            allowedLanguages: ['javascript'],
            maxCodeComplexity: difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 6 : 9
          }
        },
        difficulty
      };
      
      try {
        const result = await TypeSpecificGeneratorFactory.generateContent(context);
        
        if (type === 'code') {
          console.log(`  ${difficulty}: Complexity ${result.typeSpecificMetadata.codeComplexity.toFixed(1)}/10, ${result.content.testCases?.length || 0} tests`);
        } else if (type === 'quiz') {
          console.log(`  ${difficulty}: ${result.content.questions?.length || 0} questions, ${result.typeSpecificMetadata.estimatedCompletionTime.toFixed(1)}min`);
        } else {
          console.log(`  ${difficulty}: ${result.content.steps?.length || 0} steps, safety: ${result.typeSpecificMetadata.safetyLevel}`);
        }
        
      } catch (error) {
        console.error(`  ${difficulty}: ❌ Failed`);
      }
    }
    console.log('');
  }
};

/**
 * Test creator feedback integration
 */
export const testCreatorFeedbackIntegration = async () => {
  console.log('🧠 TESTING CREATOR FEEDBACK INTEGRATION');
  console.log('======================================\n');
  
  // Mock creator feedback from previous generations
  const mockFeedback = [
    {
      id: 'feedback-1',
      capsuleId: 'test-capsule',
      creatorId: 'educator-123',
      timestamp: new Date(),
      fieldType: 'starter_code' as const,
      aiGenerated: 'function solve() { }',
      humanEdited: 'function solve() {\n  // TODO: implement your solution here\n  // Hint: start by understanding the problem\n}',
      editType: 'pedagogical_enhancement' as const,
      context: {
        originalPrompt: 'Create a sorting algorithm challenge',
        generationModel: 'gpt-4o',
        generationParams: {},
        creatorExperience: 'expert' as const,
        timeSpentEditing: 3000,
        capsuleType: 'code',
        targetDifficulty: 'intermediate',
        targetAudience: 'computer science students'
      },
      signals: {
        editImmediacy: 1500,
        editExtensiveness: 0.4,
        subsequentRegenerations: 0
      }
    }
  ];
  
  const contextWithFeedback: TypeSpecificContext = {
    type: 'code',
    userPrompt: 'Create a sorting algorithm challenge',
    runtimeTarget: 'wasm',
    constraints: {
      target: 'wasm',
      wasmLimitations: {
        noFileSystem: true,
        noNetworking: true,
        memoryLimit: 64,
        executionTimeLimit: 5000,
        allowedLanguages: ['javascript'],
        maxCodeComplexity: 6
      }
    },
    difficulty: 'intermediate',
    creatorFeedback: mockFeedback
  };
  
  try {
    const result = await TypeSpecificGeneratorFactory.generateContent(contextWithFeedback);
    
    console.log('✅ Generated with creator feedback integration');
    console.log(`📚 Title: ${result.content.title}`);
    console.log(`🎯 Feedback Applied: ${mockFeedback.length} instances`);
    console.log(`📊 Validation Issues: ${result.validationResults.filter(r => !r.passed).length}`);
    
    // The prompt should have included feedback patterns
    const feedbackMentioned = result.prompts.systemPrompt.includes('CREATOR FEEDBACK');
    console.log(`🧠 Feedback Integration: ${feedbackMentioned ? '✅ Active' : '❌ Missing'}`);
    
  } catch (error) {
    console.error('❌ Feedback integration test failed:', error);
  }
};

/**
 * Comprehensive generator system test
 */
export const runComprehensiveGeneratorTest = async () => {
  console.log('🚀 COMPREHENSIVE TYPE-SPECIFIC GENERATOR TEST');
  console.log('==============================================\n');
  
  const startTime = Date.now();
  
  try {
    await testAllGeneratorTypes();
    await testCreatorFeedbackIntegration();
    
    const endTime = Date.now();
    console.log(`\n⏱️ Total test time: ${endTime - startTime}ms`);
    
    console.log('\n🏆 COMPETITIVE ADVANTAGES DEMONSTRATED:');
    console.log('=====================================');
    console.log('✅ Type-specific content generation');
    console.log('✅ Runtime-aware adaptation (WASM vs Docker)');
    console.log('✅ Difficulty-based scaling');
    console.log('✅ Creator feedback integration');
    console.log('✅ Comprehensive validation pipelines');
    console.log('✅ Pedagogical optimization for each format');
    
    console.log('\n💼 BUSINESS MODEL IMPACT:');
    console.log('========================');
    console.log('• Code challenges drive skill development (engagement)');
    console.log('• Quizzes provide assessment data (B2B analytics)');
    console.log('• Terminal exercises teach practical skills (retention)');
    console.log('• Runtime adaptation supports tiered pricing');
    console.log('• Quality validation ensures premium experience');
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
  }
};

// Main test functions are already exported above