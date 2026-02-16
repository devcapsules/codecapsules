/**
 * AI Service Adapter for Backend Azure OpenAI Integration
 * 
 * This adapter bridges the gap between the frontend generators that expect
 * an AIService interface and the backend Azure OpenAI client implementation.
 */

import { AIMessage, AIResponse } from '../../../packages/core/src/services/ai-service';
import { createChatCompletion } from './azure-openai-client';

export interface IAIService {
  generateContent(messages: AIMessage[], options?: {
    maxTokens?: number;
    temperature?: number;
    responseFormat?: 'text' | 'json';
  }): Promise<AIResponse>;
  
  generateJSON<T = any>(messages: AIMessage[], schema?: any): Promise<T>;
  
  generateContentStream(messages: AIMessage[]): AsyncGenerator<string>;
}

export class BackendAIService implements IAIService {
  constructor() {
    // No configuration needed - uses the backend azure-openai-client
  }

  async generateContent(messages: AIMessage[], options?: {
    maxTokens?: number;
    temperature?: number;
    responseFormat?: 'text' | 'json';
  }): Promise<AIResponse> {
    try {
      // Convert AIMessage format to OpenAI format
      const openAIMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await createChatCompletion(openAIMessages, {
        temperature: options?.temperature ?? 0.5, // Slightly lower default
        max_tokens: options?.maxTokens || 1500, // Reduced from 2000
        response_format: options?.responseFormat === 'json' ? { type: 'json_object' } : undefined
      });

      return {
        content: response.choices[0]?.message?.content || '',
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        } : undefined
      };
    } catch (error) {
      console.error('Backend AI Service error:', error);
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateJSON<T = any>(messages: AIMessage[], options?: any): Promise<T> {
    // Extract options for JSON generation
    const maxTokens = options?.max_tokens || options?.maxTokens || 1500; // Reduced from 2000
    const temperature = options?.temperature ?? 0.2; // Lower for more consistent output
    
    // Add JSON formatting instruction to system message
    const enhancedMessages = [...messages];
    if (enhancedMessages[0]?.role === 'system') {
      enhancedMessages[0].content += '\n\nIMPORTANT: Respond with valid JSON only. No additional text or formatting.';
    }

    const response = await this.generateContent(enhancedMessages, {
      responseFormat: 'json',
      temperature: temperature,
      maxTokens: maxTokens
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      console.error('Failed to parse JSON response:', response.content);
      throw new Error(`Invalid JSON response from AI: ${error}`);
    }
  }

  async *generateContentStream(messages: AIMessage[]): AsyncGenerator<string> {
    // For now, yield the complete response
    // TODO: Implement actual streaming when needed
    const response = await this.generateContent(messages);
    yield response.content;
  }
}