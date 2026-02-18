/**
 * AI Service - Centralized Azure OpenAI Integration
 * 
 * Provides a unified interface for all content generators to access
 * Azure OpenAI GPT-4o with proper error handling, retry logic,
 * and response parsing.
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIServiceConfig {
  apiKey: string;
  endpoint: string;
  deployment: string;
  apiVersion: string;
  maxTokens?: number;
  temperature?: number;
  retries?: number;
}

/**
 * Sanitize Python literals and expressions in AI-generated JSON.
 * GPT often outputs Python booleans (True/False/None) and expressions
 * like "a" * 1000 instead of valid JSON.
 */
function sanitizePythonLiterals(content: string): string {
  let s = content;

  // Replace Python booleans/None that appear as JSON values (not inside strings)
  // Match True/False/None when preceded by : or , or [ and optional whitespace
  s = s.replace(/(?<=[:,\[\s])True(?=[\s,\]\}])/g, 'true');
  s = s.replace(/(?<=[:,\[\s])False(?=[\s,\]\}])/g, 'false');
  s = s.replace(/(?<=[:,\[\s])None(?=[\s,\]\}])/g, 'null');

  // Fix Python string expressions: "A"*100 + "1!" or "a" * 1000 + "@" → single literal string
  // Handles: "str" * N, "str" * N + "str2", "str" * N + "str2" + "str3", etc.
  s = s.replace(/"([^"]{1,20})"\s*\*\s*(\d+)(\s*\+\s*"([^"]*)")*/g, (fullMatch, char, count) => {
    const n = Math.min(parseInt(count), 200);
    let result = char.repeat(n);
    // Extract all concatenated string literals: + "..."
    const concatParts = fullMatch.match(/\+\s*"([^"]*)"/g);
    if (concatParts) {
      for (const part of concatParts) {
        const str = part.match(/"([^"]*)"/)?.[1] || '';
        result += str;
      }
    }
    return `"${result.slice(0, 200)}"`;
  });

  // Fix Python repeat patterns in escaped form: \"a\".repeat(1000)
  s = s.replace(/"\\"([^"]*)\\"\.repeat\((\d+)\)"/g, (_match, char, count) => {
    const n = Math.min(parseInt(count), 200);
    return `"${char.repeat(n).slice(0, 200)}"`;
  });

  // Fix -Infinity / Infinity / NaN (not valid JSON)
  s = s.replace(/-Infinity/g, 'null');
  s = s.replace(/Infinity/g, 'null');
  s = s.replace(/NaN/g, 'null');

  // Fix Python set notation {a, b, c} used as list → [a, b, c]
  s = s.replace(/\{\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,?\s*\}/g, '["$1", "$2", "$3"]');
  s = s.replace(/\{\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,?\s*\}/g, '["$1", "$2"]');

  // Fix Python list comprehension or f-string artifacts that break JSON
  // e.g., [f"..." for x in ...] → replace with a simple placeholder
  s = s.replace(/\[f?"[^"]*"\s+for\s+[^\]]+\]/g, '"<generated>"');

  return s;
}

export class AIService {
  private config: AIServiceConfig;
  
  constructor(config: AIServiceConfig) {
    this.config = {
      maxTokens: 2000,
      temperature: 0.7,
      retries: 3,
      ...config
    };
  }

  /**
   * Generate content using Azure OpenAI GPT-4o
   */
  async generateContent(messages: AIMessage[], options?: {
    maxTokens?: number;
    temperature?: number;
    responseFormat?: 'text' | 'json';
  }): Promise<AIResponse> {
    const requestOptions = {
      maxTokens: options?.maxTokens || this.config.maxTokens,
      temperature: options?.temperature || this.config.temperature
    };

    for (let attempt = 1; attempt <= (this.config.retries || 3); attempt++) {
      try {
        const response = await this.makeAPICall(messages, requestOptions);
        return this.parseResponse(response, options?.responseFormat);
      } catch (error) {
        console.error(`AI generation attempt ${attempt} failed:`, error);
        
        if (attempt === this.config.retries) {
          throw new Error(`AI generation failed after ${this.config.retries} attempts: ${error}`);
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
    
    throw new Error('AI generation failed');
  }

  /**
   * Generate structured JSON content
   */
  async generateJSON<T = any>(messages: AIMessage[], schema?: any): Promise<T> {
    // Add JSON formatting instruction to system message
    const enhancedMessages = [...messages];
    if (enhancedMessages[0]?.role === 'system') {
      enhancedMessages[0].content += '\n\nIMPORTANT: Respond with valid JSON only. No additional text or formatting. Use JSON booleans (true/false) NOT Python booleans (True/False). Use null NOT None. Use literal string values NOT expressions like "a" * 1000.';
    }

    const response = await this.generateContent(enhancedMessages, {
      responseFormat: 'json',
      temperature: 0.3 // Lower temperature for more consistent JSON
    });

    try {
      // Clean the response by removing markdown code blocks and explanatory text
      let cleanedContent = response.content.trim();
      
      // Handle explanatory text followed by JSON
      if (cleanedContent.includes('```json')) {
        // Extract content between ```json and ``` markers
        const jsonMatch = cleanedContent.match(/```json\s*([\s\S]*?)```/);
        if (jsonMatch) {
          cleanedContent = jsonMatch[1].trim();
        }
      } else if (cleanedContent.startsWith('```json') && cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(7, -3).trim(); // Remove ```json and ```
      } else if (cleanedContent.startsWith('```') && cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(3, -3).trim(); // Remove ``` and ```
      } else {
        // Handle cases where there's explanatory text before JSON without markdown
        const jsonStart = cleanedContent.indexOf('{');
        if (jsonStart > 0) {
          // There's text before the JSON, extract just the JSON part
          const jsonEnd = cleanedContent.lastIndexOf('}');
          if (jsonEnd > jsonStart) {
            cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
          }
        }
      }
      
      // Try to fix common JSON issues
      cleanedContent = sanitizePythonLiterals(cleanedContent);
      
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Failed to parse JSON response:', response.content);
      
      // Try one more time with more aggressive cleaning
      try {
        let fallbackContent = response.content.trim();
        
        // Remove explanatory text and markdown
        if (fallbackContent.includes('```json')) {
          // Extract content between ```json and ``` markers
          const jsonMatch = fallbackContent.match(/```json\s*([\s\S]*?)```/);
          if (jsonMatch) {
            fallbackContent = jsonMatch[1].trim();
          }
        } else if (fallbackContent.includes('```')) {
          fallbackContent = fallbackContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        }
        
        // Remove any explanatory text before JSON
        const jsonStart = fallbackContent.indexOf('{');
        const jsonEnd = fallbackContent.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          fallbackContent = fallbackContent.substring(jsonStart, jsonEnd + 1);
        }
        
        // Replace problematic patterns
        fallbackContent = sanitizePythonLiterals(fallbackContent);
          
        return JSON.parse(fallbackContent);
      } catch (fallbackError) {
        console.error('Fallback JSON parsing also failed. Original error:', error);
        throw new Error(`Invalid JSON response from AI: ${error}`);
      }
    }
  }

  /**
   * Generate content with streaming (for future real-time updates)
   */
  async *generateContentStream(messages: AIMessage[]): AsyncGenerator<string> {
    // For now, yield the complete response
    // TODO: Implement actual streaming when Azure OpenAI supports it
    const response = await this.generateContent(messages);
    yield response.content;
  }

  private async makeAPICall(messages: AIMessage[], options: any): Promise<any> {
    const url = `${this.config.endpoint}/openai/deployments/${this.config.deployment}/chat/completions?api-version=${this.config.apiVersion}`;
    
    const body = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.config.apiKey
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  private parseResponse(apiResponse: any, format?: 'text' | 'json'): AIResponse {
    const choice = apiResponse.choices?.[0];
    if (!choice) {
      throw new Error('No response from AI');
    }

    const content = choice.message?.content || '';
    const usage = apiResponse.usage ? {
      promptTokens: apiResponse.usage.prompt_tokens,
      completionTokens: apiResponse.usage.completion_tokens,
      totalTokens: apiResponse.usage.total_tokens
    } : undefined;

    return { content, usage };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create AI service instance
 */
export function createAIService(): AIService {
  const config: AIServiceConfig = {
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview'
  };

  if (!config.apiKey || !config.endpoint) {
    throw new Error('Azure OpenAI configuration missing. Please set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT environment variables.');
  }

  return new AIService(config);
}

/**
 * Safe factory function that doesn't throw on missing config
 */
export function tryCreateAIService(): AIService | null {
  try {
    return createAIService();
  } catch (error) {
    return null;
  }
}