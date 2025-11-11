/**
 * Test script for BackendAIService
 */

import { BackendAIService } from './ai-service-adapter';
import dotenv from 'dotenv';

dotenv.config();

async function testBackendAIService() {
  console.log('🧪 Testing BackendAIService...');
  
  const aiService = new BackendAIService();
  
  try {
    // Test simple text generation
    console.log('📝 Testing text generation...');
    const textResponse = await aiService.generateContent([
      { role: 'system', content: 'You are a helpful coding instructor.' },
      { role: 'user', content: 'Create a simple coding challenge about adding two numbers' }
    ]);
    
    console.log('✅ Text generation successful!');
    console.log('📤 Response:', textResponse.content.substring(0, 200) + '...');
    
    // Test JSON generation
    console.log('\n📝 Testing JSON generation...');
    const jsonResponse = await aiService.generateJSON([
      { role: 'system', content: 'You are a helpful coding instructor. Respond only with valid JSON.' },
      { role: 'user', content: 'Create a simple coding challenge about adding two numbers. Format: {"title": "...", "description": "..."}' }
    ]);
    
    console.log('✅ JSON generation successful!');
    console.log('📤 JSON Response:', JSON.stringify(jsonResponse, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBackendAIService().catch(console.error);