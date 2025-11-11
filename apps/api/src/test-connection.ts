/**
 * Azure OpenAI Connection Test
 * 
 * This script tests the connection to your Azure OpenAI service
 * using the provided credentials.
 */

import { azureOpenAI, createChatCompletion, azureConfig } from './azure-openai-client';

async function testAzureOpenAIConnection() {
  console.log('🧪 Testing Azure OpenAI Connection...\n');
  
  // Display configuration (without exposing full API key)
  console.log('📋 Configuration:');
  console.log(`   Endpoint: ${azureConfig.endpoint}`);
  console.log(`   Deployment: ${azureConfig.deployment}`);
  console.log(`   API Version: ${azureConfig.apiVersion}`);
  console.log(`   API Key: ${azureConfig.apiKey?.substring(0, 8)}...${azureConfig.apiKey?.slice(-8)}\n`);
  
  try {
    // Test basic completion
    console.log('🚀 Testing basic chat completion...');
    
    const testMessages = [
      {
        role: 'system' as const,
        content: 'You are a helpful AI assistant for educational content creation.'
      },
      {
        role: 'user' as const,
        content: 'Generate a simple "Hello World" coding challenge for beginners in JavaScript. Return only a JSON object with title, description, and code fields.'
      }
    ];
    
    const response = await createChatCompletion(testMessages, {
      temperature: 0.7,
      max_tokens: 500
    });
    
    console.log('✅ Connection successful!');
    console.log('📤 Generated response:');
    console.log(response.choices[0]?.message?.content?.substring(0, 200) + '...\n');
    
    // Test with JSON response format
    console.log('🧪 Testing JSON response format...');
    
    const jsonResponse = await createChatCompletion(testMessages, {
      temperature: 0.5,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    });
    
    console.log('✅ JSON format test successful!');
    console.log('📤 JSON response:');
    console.log(jsonResponse.choices[0]?.message?.content?.substring(0, 200) + '...\n');
    
    // Test token usage
    console.log('📊 Usage statistics:');
    console.log(`   Prompt tokens: ${response.usage?.prompt_tokens || 'N/A'}`);
    console.log(`   Completion tokens: ${response.usage?.completion_tokens || 'N/A'}`);
    console.log(`   Total tokens: ${response.usage?.total_tokens || 'N/A'}\n`);
    
    console.log('🎉 All tests passed! Your Azure OpenAI setup is working correctly.');
    console.log('🚀 Ready to generate educational content with AI!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    if (error instanceof Error && error.message.includes('401')) {
      console.error('   💡 Suggestion: Check your API key and ensure it has the correct permissions');
    } else if (error instanceof Error && error.message.includes('404')) {
      console.error('   💡 Suggestion: Verify your endpoint URL and deployment name');
    } else if (error instanceof Error && error.message.includes('429')) {
      console.error('   💡 Suggestion: You may have hit rate limits, try again in a moment');
    }
    
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAzureOpenAIConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export default testAzureOpenAIConnection;