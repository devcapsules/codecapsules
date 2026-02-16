/**
 * AI Generation Workflows - Production Examples
 * 
 * This demonstrates the complete AI generation pipeline
 * with all 6 competitive moats working together.
 */

import { CapsuleGenerationEngine } from './generation-engine';
import { CreatorFeedbackCapture } from '../types/creator-feedback';
import type { GenerationConfig } from './generation-engine';
import { AIService } from '../services/ai-service';

/**
 * Example 1: Free Tier WASM Generation
 * 
 * For users on the free tier, we generate simpler content
 * that runs efficiently in WASM sandboxes.
 */
export const generateFreeTierCapsule = async () => {
  const aiService = new AIService({
    apiKey: process.env.AZURE_OPENAI_KEY!,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    deployment: 'gpt-4o',
    apiVersion: '2024-06-01'
  });
  
  const engine = new CapsuleGenerationEngine(
    aiService,
    CreatorFeedbackCapture
  );

  const config: GenerationConfig = {
    prompt: "Create a simple JavaScript function to reverse a string",
    capsuleType: 'code',
    runtimeTarget: 'wasm',
    difficulty: 'easy',
    aiModel: 'gpt-4o',
    useCreatorFeedback: true,
    temperature: 0.7,
    maxTokens: 1500,
    constraints: {
      target: 'wasm',
      wasmLimitations: {
        noFileSystem: true,
        noNetworking: true,
        memoryLimit: 32, // Small memory footprint for free tier
        executionTimeLimit: 3000,
        allowedLanguages: ['javascript'],
        maxCodeComplexity: 5 // Keep it simple
      }
    },
    qualityThreshold: 0.7, // Lower threshold for free tier
    maxRegenerationAttempts: 2
  };

  return await engine.generateCapsule(config);
};

/**
 * Example 2: Pro Tier Docker Generation
 * 
 * For paying customers, we generate complex content
 * with full Docker capabilities and higher quality.
 */
export const generateProTierCapsule = async () => {
  const aiService = new AIService({
    apiKey: process.env.AZURE_OPENAI_KEY!,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    deployment: 'gpt-4o',
    apiVersion: '2024-06-01'
  });
  
  const engine = new CapsuleGenerationEngine(
    aiService,
    CreatorFeedbackCapture
  );

  const config: GenerationConfig = {
    prompt: "Create a full-stack application with Node.js backend and React frontend that manages a todo list with authentication",
    capsuleType: 'code',
    runtimeTarget: 'docker',
    difficulty: 'hard',
    aiModel: 'gpt-4o',
    useCreatorFeedback: true,
    temperature: 0.8,
    maxTokens: 4000,
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
    qualityThreshold: 0.9, // High quality for paying customers
    maxRegenerationAttempts: 5
  };

  return await engine.generateCapsule(config);
};

/**
 * Example 3: Educational Institution Bulk Generation
 * 
 * For B2B customers, we track detailed analytics
 * and provide bulk generation capabilities.
 */
export const generateEducationalCurriculum = async (
  topics: string[],
  institutionId: string
) => {
  const aiService = new AIService({
    apiKey: process.env.AZURE_OPENAI_KEY!,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    deployment: 'gpt-4o',
    apiVersion: '2024-06-01'
  });
  
  const engine = new CapsuleGenerationEngine(
    aiService,
    CreatorFeedbackCapture
  );

  const results = [];

  for (const [index, topic] of topics.entries()) {
    console.log(`📚 Generating curriculum ${index + 1}/${topics.length}: ${topic}`);

    const config: GenerationConfig = {
      prompt: `Create a progressive coding exercise for computer science students learning ${topic}. Include clear explanations, example code, and test cases.`,
      capsuleType: 'code',
      runtimeTarget: 'hybrid', // Can run in both environments
      difficulty: 'medium',
      aiModel: 'gpt-4o',
      useCreatorFeedback: true,
      temperature: 0.6, // More consistent for educational content
      maxTokens: 3000,
      constraints: {
        target: 'hybrid',
        wasmLimitations: {
          noFileSystem: false, // Allow some file operations for learning
          noNetworking: true,
          memoryLimit: 128,
          executionTimeLimit: 10000,
          allowedLanguages: ['javascript', 'python', 'java'],
          maxCodeComplexity: 8
        },
        dockerCapabilities: {
          fileSystemAccess: true,
          networkAccess: false, // Security for educational environment
          databaseAccess: false,
          externalAPIAccess: false,
          multiFileProjects: true,
          customDependencies: true,
          unlimitedExecution: false
        }
      },
      qualityThreshold: 0.85,
      maxRegenerationAttempts: 3
    };

    const result = await engine.generateCapsule(config);
    
    // Add B2B analytics tracking
    console.log(`✅ Generated capsule for ${topic}`);
    console.log(`📊 Institution: ${institutionId}`);
    console.log(`🎯 Quality Score: ${result.qualityScore.toFixed(2)}`);
    console.log(`⏱️ Generation Time: ${result.generationMetadata.generationTime}ms`);
    
    results.push({
      topic,
      capsule: result.capsule,
      analytics: {
        institutionId,
        topic,
        qualityScore: result.qualityScore,
        generationTime: result.generationMetadata.generationTime,
        tokensUsed: result.generationMetadata.tokensUsed,
        timestamp: new Date()
      }
    });

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
};

/**
 * Example 4: Creator Feedback Integration
 * 
 * Shows how the system learns from human creators
 * to improve future generations.
 */
export const generateWithCreatorFeedback = async (
  prompt: string,
  previousFeedback?: string
) => {
  const aiService = new AIService({
    apiKey: process.env.AZURE_OPENAI_KEY!,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    deployment: 'gpt-4o',
    apiVersion: '2024-06-01'
  });
  
  const engine = new CapsuleGenerationEngine(
    aiService,
    CreatorFeedbackCapture
  );

  // Simulate creator feedback from previous generations
  if (previousFeedback) {
    console.log(`🧠 Applying creator feedback: "${previousFeedback}"`);
  }

  const config: GenerationConfig = {
    prompt,
    capsuleType: 'code',
    runtimeTarget: 'wasm',
    difficulty: 'medium',
    aiModel: 'gpt-4o',
    useCreatorFeedback: true, // This is the key difference
    temperature: 0.7,
    maxTokens: 2500,
    constraints: {
      target: 'wasm',
      wasmLimitations: {
        noFileSystem: true,
        noNetworking: true,
        memoryLimit: 64,
        executionTimeLimit: 5000,
        allowedLanguages: ['javascript', 'typescript'],
        maxCodeComplexity: 7
      }
    },
    qualityThreshold: 0.8,
    maxRegenerationAttempts: 3
  };

  const result = await engine.generateCapsule(config);

  console.log('🎯 Creator Feedback Integration Demo:');
  console.log(`📝 Original Prompt: "${prompt}"`);
  console.log(`🔄 Feedback Applied: ${config.useCreatorFeedback ? 'Yes' : 'No'}`);
  console.log(`📊 Quality Score: ${result.qualityScore.toFixed(2)}`);
  console.log(`🎨 Feedback Used: ${result.generationMetadata.feedbackUsed.length} instances`);

  return result;
};

/**
 * Example Usage
 */
export const runExamples = async () => {
  console.log('🚀 Starting AI Generation Workflow Examples...\n');

  try {
    // Free tier example
    console.log('1️⃣ Free Tier WASM Generation:');
    const freeTier = await generateFreeTierCapsule();
    console.log(`✅ Free tier capsule: ${freeTier.capsule.title}\n`);

    // Pro tier example  
    console.log('2️⃣ Pro Tier Docker Generation:');
    const proTier = await generateProTierCapsule();
    console.log(`✅ Pro tier capsule: ${proTier.capsule.title}\n`);

    // Educational bulk generation
    console.log('3️⃣ Educational Curriculum Generation:');
    const curriculum = await generateEducationalCurriculum(
      ['Variables and Data Types', 'Control Flow', 'Functions'],
      'university-123'
    );
    console.log(`✅ Generated ${curriculum.length} curriculum capsules\n`);

    // Creator feedback integration
    console.log('4️⃣ Creator Feedback Integration:');
    const withFeedback = await generateWithCreatorFeedback(
      'Create a function to calculate Fibonacci numbers',
      'Make it more interactive with step-by-step visualization'
    );
    console.log(`✅ Feedback-enhanced capsule: ${withFeedback.capsule.title}\n`);

    console.log('🎉 All examples completed successfully!');
    console.log('\n🏰 Competitive Moats Demonstrated:');
    console.log('✓ Runtime-aware content (WASM vs Docker)');
    console.log('✓ Tiered pricing model (Free vs Pro)');
    console.log('✓ B2B analytics and bulk generation');
    console.log('✓ Creator feedback learning loop');
    console.log('✓ Quality assurance and regeneration');
    console.log('✓ Universal capsule format');

  } catch (error) {
    console.error('❌ Example execution failed:', error);
    throw error;
  }
};

// Export everything for use in other modules
export {
  CapsuleGenerationEngine,
  CreatorFeedbackCapture
};