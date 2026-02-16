/**
 * AI Mentor API Endpoint - Ultra-fast hint service with deterministic caching
 * 
 * This endpoint handles POST /api/mentor/hint requests from the widget frontend.
 * It's designed to feel like an expensive AI tutor but cost pennies through caching.
 */

import { AIMentor } from '../analytics/ai-mentor';
import { MentorRequest, MentorResponse } from '../types/analytics';

// Global mentor instance (in production, this would be properly initialized)
let mentorInstance: AIMentor | null = null;

export interface MentorApiRequest {
  user_id: string;
  capsule_id: string;
  test_case_id: string;
  submitted_code: string;
  error_signature: {
    error_type: string;
    error_message: string;
    test_case_id: string;
    capsule_id: string;
    code_context?: string;
  };
  timestamp: string;
}

export interface MentorApiResponse {
  success: boolean;
  data?: MentorResponse;
  error?: string;
  debug_info?: {
    cache_hit: boolean;
    processing_time_ms: number;
    cost_estimate: number;
  };
}

/**
 * POST /api/mentor/hint
 * Main endpoint for getting AI mentor hints
 */
export async function handleMentorHintRequest(
  request: MentorApiRequest
): Promise<MentorApiResponse> {
  const startTime = Date.now();

  try {
    // Initialize mentor if not already done
    if (!mentorInstance) {
      mentorInstance = initializeMentor();
    }

    // Validate request
    const validationError = validateRequest(request);
    if (validationError) {
      return {
        success: false,
        error: validationError,
        debug_info: {
          cache_hit: false,
          processing_time_ms: Date.now() - startTime,
          cost_estimate: 0
        }
      };
    }

    // Convert API request to internal format
    const mentorRequest: MentorRequest = {
      user_id: request.user_id,
      capsule_id: request.capsule_id,
      test_case_id: request.test_case_id,
      submitted_code: request.submitted_code,
      error_signature: request.error_signature,
      timestamp: new Date(request.timestamp)
    };

    // Get hint from mentor (this handles caching automatically)
    const hintResponse = await mentorInstance.getHint(mentorRequest);

    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      data: hintResponse,
      debug_info: {
        cache_hit: hintResponse.is_cached,
        processing_time_ms: processingTime,
        cost_estimate: hintResponse.is_cached ? 0.001 : 0.05 // $0.001 for cache, $0.05 for AI
      }
    };

  } catch (error) {
    console.error('[MentorAPI] Error processing hint request:', error);
    
    return {
      success: false,
      error: 'Internal server error',
      debug_info: {
        cache_hit: false,
        processing_time_ms: Date.now() - startTime,
        cost_estimate: 0
      }
    };
  }
}

/**
 * POST /api/mentor/feedback
 * Record learner feedback on hint quality
 */
export async function handleHintFeedback(request: {
  hint_id: string;
  is_helpful: boolean;
  user_id: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!mentorInstance) {
      mentorInstance = initializeMentor();
    }

    await mentorInstance.recordHintFeedback(request.hint_id, request.is_helpful);
    
    return { success: true };
  } catch (error) {
    console.error('[MentorAPI] Error recording feedback:', error);
    return { 
      success: false, 
      error: 'Failed to record feedback' 
    };
  }
}

/**
 * POST /api/mentor/outcome
 * Record whether hint led to learner success
 */
export async function handleHintOutcome(request: {
  hint_id: string;
  learner_succeeded: boolean;
  user_id: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!mentorInstance) {
      mentorInstance = initializeMentor();
    }

    await mentorInstance.recordHintOutcome(request.hint_id, request.learner_succeeded);
    
    return { success: true };
  } catch (error) {
    console.error('[MentorAPI] Error recording outcome:', error);
    return { 
      success: false, 
      error: 'Failed to record outcome' 
    };
  }
}

/**
 * GET /api/mentor/analytics
 * Get mentor system analytics for dashboard
 */
export async function handleAnalyticsRequest(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    if (!mentorInstance) {
      mentorInstance = initializeMentor();
    }

    const analytics = mentorInstance.getAnalytics();
    
    return {
      success: true,
      data: {
        // Cost efficiency metrics
        total_requests: analytics.total_requests,
        cache_hit_rate: `${(analytics.cache_hit_rate * 100).toFixed(1)}%`,
        total_cost_saved: `$${analytics.total_cost_saved.toFixed(2)}`,
        avg_response_time: `${analytics.avg_response_time_ms.toFixed(0)}ms`,
        
        // Quality metrics
        hint_effectiveness: `${(analytics.hint_effectiveness_rate * 100).toFixed(1)}%`,
        learner_satisfaction: `${analytics.learner_satisfaction_score.toFixed(1)}/5`,
        
        // Cost analysis
        estimated_monthly_savings: `$${(analytics.total_cost_saved * 30).toFixed(0)}`,
        roi_multiplier: `${((analytics.cache_hit_rate * 50) + 1).toFixed(1)}x`,
        
        // Popular errors
        top_errors: analytics.top_error_signatures.slice(0, 5).map(sig => ({
          error_type: sig.error_signature_hash.substring(0, 8) + '...',
          frequency: sig.frequency,
          effectiveness: `${(sig.effectiveness_score * 100).toFixed(0)}%`
        }))
      }
    };
  } catch (error) {
    console.error('[MentorAPI] Error getting analytics:', error);
    return { 
      success: false, 
      error: 'Failed to get analytics' 
    };
  }
}

// Helper functions

function initializeMentor(): AIMentor {
  // Mock AI service for demonstration
  const mockAIService = {
    async complete(params: any) {
      // Simulate AI response based on error type
      const hints = {
        'IndexError': "Great start! It looks like you're trying to access an item that might not exist. How could you check the list length first?",
        'TypeError': "Nice try! The error suggests you're using the wrong data type. What type is your variable, and what type does the function expect?",
        'ValueError': "Good effort! The value you're passing seems incorrect. Double-check what values this function accepts.",
        'SyntaxError': "Almost there! There's a small syntax issue. Check your parentheses, brackets, and indentation.",
        'NameError': "Close! It looks like you're using a variable that doesn't exist yet. Did you define it earlier?",
        'AttributeError': "Nice work so far! The object you're working with doesn't have that method. What methods are available on this type?"
      };

      const errorType = params.messages[0].content.includes('IndexError') ? 'IndexError' :
                       params.messages[0].content.includes('TypeError') ? 'TypeError' :
                       params.messages[0].content.includes('ValueError') ? 'ValueError' :
                       params.messages[0].content.includes('SyntaxError') ? 'SyntaxError' :
                       params.messages[0].content.includes('NameError') ? 'NameError' :
                       params.messages[0].content.includes('AttributeError') ? 'AttributeError' :
                       'IndexError';

      return {
        content: hints[errorType as keyof typeof hints] || hints.IndexError,
        confidence: 0.85
      };
    }
  };

  return new AIMentor(mockAIService, {
    ai_model: 'gemini-2.5-pro',
    enable_caching: true,
    max_hint_length: 150,
    fallback_hint: "Try reviewing the error message carefully and checking your logic step by step. Look for common issues like variable names, data types, or missing values.",
    max_ai_calls_per_hour: 1000,
    min_confidence_threshold: 0.7
  });
}

function validateRequest(request: MentorApiRequest): string | null {
  if (!request.user_id) return 'Missing user_id';
  if (!request.capsule_id) return 'Missing capsule_id';
  if (!request.test_case_id) return 'Missing test_case_id';
  if (!request.submitted_code) return 'Missing submitted_code';
  if (!request.error_signature?.error_message) return 'Missing error_message';
  if (!request.error_signature?.error_type) return 'Missing error_type';
  
  return null;
}

// Export for Next.js API routes or similar
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = await handleMentorHintRequest(req.body);
  
  res.status(result.success ? 200 : 400).json(result);
}

// Usage examples for different frameworks:

// Express.js
export const expressHandler = (req: any, res: any) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  handleMentorHintRequest(req.body).then(result => {
    res.status(result.success ? 200 : 400).json(result);
  });
};

// Cloudflare Workers
export const cloudflareHandler = async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const body = await request.json();
  const result = await handleMentorHintRequest(body);
  
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};

// Vercel Edge Functions
export const vercelHandler = async (request: Request): Promise<Response> => {
  return cloudflareHandler(request);
};