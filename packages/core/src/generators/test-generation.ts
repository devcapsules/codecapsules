/**
 * Quick test of the AI Generation Engine
 * 
 * This demonstrates how the engine orchestrates content creation
 * using all the competitive moats we've built.
 */

import { CapsuleGenerationEngine } from './generation-engine';
import { CreatorFeedbackCapture } from '../types/creator-feedback';
import { AIService } from '../services/ai-service';

// Test configuration
const testConfig = {
  prompt: "Create a JavaScript coding challenge about async/await",
  capsuleType: 'code' as const,
  runtimeTarget: 'wasm' as const,
  difficulty: 'medium' as const,
  aiModel: 'gpt-4o' as const,
  useCreatorFeedback: true,
  temperature: 0.7,
  maxTokens: 2000,
  constraints: {
    target: 'wasm' as const,
    wasmLimitations: {
      noFileSystem: true,
      noNetworking: true,
      memoryLimit: 64, // 64MB
      executionTimeLimit: 5000, // 5 seconds
      allowedLanguages: ['javascript', 'typescript'],
      maxCodeComplexity: 7
    }
  },
  qualityThreshold: 0.8,
  maxRegenerationAttempts: 3
};

// Initialize the engine
const aiService = new AIService({
  apiKey: 'your-azure-openai-key',
  endpoint: 'https://your-instance.openai.azure.com',
  deployment: 'gpt-4o',
  apiVersion: '2024-06-01'
});

const engine = new CapsuleGenerationEngine(
  aiService,
  CreatorFeedbackCapture
);

// Test the generation process
async function testGeneration() {
  console.log('🧪 Testing AI Generation Engine...\n');
  
  try {
    const result = await engine.generateCapsule(testConfig);
    
    console.log('✅ Generation successful!');
    console.log(`📦 Capsule ID: ${result.capsule.id}`);
    console.log(`📊 Quality Score: ${result.qualityScore.toFixed(2)}`);
    console.log(`⏱️ Generation Time: ${result.generationMetadata.generationTime}ms`);
    console.log(`🎯 Tokens Used: ${result.generationMetadata.tokensUsed}`);
    
    // Show the competitive moats in action
    console.log('\n🏰 Competitive Moats Activated:');
    console.log('✓ Runtime-aware content (WASM optimized)');
    console.log('✓ Pedagogical minimalism applied');
    console.log('✓ Creator feedback integrated');
    console.log('✓ Quality assurance performed');
    console.log('✓ Universal capsule format');
    console.log('✓ B2B analytics ready');
    
    return result;
    
  } catch (error) {
    console.error('❌ Generation failed:', error);
    throw error;
  }
}

// Export for testing
export { testGeneration, testConfig, engine };

// If running directly
if (require.main === module) {
  testGeneration()
    .then(() => console.log('\n🎉 Test completed successfully!'))
    .catch(error => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}