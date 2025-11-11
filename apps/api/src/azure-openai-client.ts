/**
 * Azure OpenAI Configuration and Client Setup
 * 
 * This module configures the Azure OpenAI client with the provided credentials
 * and provides a properly typed interface for our AI generation system.
 */

import { OpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Azure OpenAI Configuration from environment variables
export const azureConfig = {
  apiKey: process.env.AZURE_CAPSULE_API_KEY,
  endpoint: process.env.AZURE_CAPSULE_ENDPOINT,
  apiVersion: process.env.AZURE_CAPSULE_API_VERSION || '2024-04-01-preview',
  deployment: process.env.AZURE_CAPSULE_DEPLOYMENT || 'gpt-4o'
};

// Validate configuration
if (!azureConfig.apiKey || !azureConfig.endpoint) {
  throw new Error('Missing required Azure OpenAI configuration. Please check your environment variables.');
}

// Create Azure OpenAI client instance
export const azureOpenAI = new OpenAI({
  apiKey: azureConfig.apiKey,
  baseURL: `${azureConfig.endpoint.replace(/\/$/, '')}/openai/deployments/${azureConfig.deployment}`,
  defaultQuery: { 'api-version': azureConfig.apiVersion },
  defaultHeaders: {
    'api-key': azureConfig.apiKey,
  },
});

// Helper function to create chat completion with proper error handling
export async function createChatCompletion(messages: any[], options: any = {}) {
  try {
    const response = await azureOpenAI.chat.completions.create({
      model: azureConfig.deployment, // Use deployment name as model
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || options.maxTokens || 2000,
      response_format: options.response_format || options.responseFormat,
      ...options
    });

    return response;
  } catch (error) {
    console.error('Azure OpenAI API Error:', error);
    throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export configuration for external use
export default {
  azureConfig,
  azureOpenAI,
  createChatCompletion
};