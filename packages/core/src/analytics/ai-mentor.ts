/**
 * AI Mentor - Real-time learner feedback with deterministic caching
 * 
 * This creates the "expensive AI tutor that costs pennies" through smart caching.
 * First learner with IndexError gets expensive LLM call, next 999 get $0.01 database lookup.
 */

import { 
  ErrorSignature, 
  MentorHint, 
  MentorRequest, 
  MentorResponse, 
  MentorAnalytics,
  MentorConfig 
} from '../types/analytics';
import crypto from 'crypto';

export class AIMentor {
  private config: MentorConfig;
  private hintCache = new Map<string, MentorHint>(); // In-memory cache for ultra-fast lookup
  private aiService: any; // AI service interface
  private stats: MentorAnalytics;

  constructor(aiService: any, config: Partial<MentorConfig> = {}) {
    this.aiService = aiService;
    this.config = {
      // AI settings
      ai_model: 'gemini-2.5-pro',
      max_hint_length: 150,
      temperature: 0.3,
      
      // Caching strategy  
      enable_caching: true,
      cache_ttl_days: 30,
      min_usage_for_permanent_cache: 5,
      
      // Cost control
      max_ai_calls_per_hour: 1000,
      fallback_hint: "Try reviewing the error message and checking your logic step by step. Look for common issues like variable names, indentation, or missing values.",
      
      // Quality control
      min_confidence_threshold: 0.7,
      enable_hint_voting: true,
      auto_retire_bad_hints: true,
      ...config
    };

    this.stats = {
      total_requests: 0,
      cache_hit_rate: 0,
      total_cost_saved: 0,
      avg_response_time_ms: 0,
      hint_effectiveness_rate: 0,
      learner_satisfaction_score: 0,
      top_error_signatures: []
    };

    console.log('[AIMentor] Initialized with config:', this.config);
    
    // Load cache from database on startup
    this.loadCacheFromDatabase();
  }

  /**
   * Get a Socratic hint for a failed test case
   * This is the main API endpoint that widget frontends call
   */
  async getHint(request: MentorRequest): Promise<MentorResponse> {
    const startTime = Date.now();
    this.stats.total_requests++;

    try {
      // Generate error signature hash for cache lookup
      const signatureHash = this.generateErrorSignatureHash(request.error_signature);
      
      // Try cache first (the cost-saving magic)
      const cachedHint = await this.getCachedHint(signatureHash);
      if (cachedHint) {
        // Cache hit! Serve cached hint for $0.01 instead of $0.05 AI call
        await this.updateHintUsage(cachedHint.id);
        
        const responseTime = Date.now() - startTime;
        this.updateStats(true, responseTime, 0.04); // $0.04 saved
        
        return {
          hint_id: cachedHint.id,
          hint_text: cachedHint.hint_text,
          is_cached: true,
          confidence_score: cachedHint.confidence_score,
          response_time_ms: responseTime,
          cost_saved: 0.04
        };
      }

      // Cache miss - generate new hint with AI (expensive but one-time)
      const newHint = await this.generateNewHint(request, signatureHash);
      
      // Cache the new hint for future learners
      if (this.config.enable_caching) {
        await this.cacheHint(newHint);
      }

      const responseTime = Date.now() - startTime;
      this.updateStats(false, responseTime, 0);

      return {
        hint_id: newHint.id,
        hint_text: newHint.hint_text,
        is_cached: false,
        confidence_score: newHint.confidence_score,
        response_time_ms: responseTime
      };

    } catch (error) {
      console.error('[AIMentor] Error generating hint:', error);
      
      // Fallback to generic hint to maintain user experience
      return {
        hint_id: 'fallback',
        hint_text: this.config.fallback_hint,
        is_cached: false,
        confidence_score: 0.5,
        response_time_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Record learner feedback on hint quality (thumbs up/down)
   */
  async recordHintFeedback(hintId: string, isHelpful: boolean): Promise<void> {
    const hint = await this.getHintById(hintId);
    if (!hint) return;

    if (isHelpful) {
      hint.learner_feedback.helpful_votes++;
    } else {
      hint.learner_feedback.unhelpful_votes++;
    }

    await this.updateHintInDatabase(hint);
    
    // Auto-retire hints with consistently poor feedback
    if (this.config.auto_retire_bad_hints) {
      const totalVotes = hint.learner_feedback.helpful_votes + hint.learner_feedback.unhelpful_votes;
      const helpfulRatio = hint.learner_feedback.helpful_votes / totalVotes;
      
      if (totalVotes >= 10 && helpfulRatio < 0.3) {
        await this.retireHint(hintId, 'Poor learner feedback');
      }
    }
  }

  /**
   * Record whether a hint led to learner success (for effectiveness scoring)
   */
  async recordHintOutcome(hintId: string, learnerSucceeded: boolean): Promise<void> {
    const hint = await this.getHintById(hintId);
    if (!hint) return;

    // Update effectiveness score (simple moving average)
    const successValue = learnerSucceeded ? 1 : 0;
    const currentScore = hint.effectiveness_score || 0.5;
    hint.effectiveness_score = (currentScore * 0.9) + (successValue * 0.1);

    await this.updateHintInDatabase(hint);
  }

  /**
   * Get mentor analytics for dashboard
   */
  getAnalytics(): MentorAnalytics {
    return { ...this.stats };
  }

  /**
   * Admin function to manually retire problematic hints
   */
  async retireHint(hintId: string, reason: string): Promise<void> {
    console.log(`[AIMentor] Retiring hint ${hintId}: ${reason}`);
    
    // Remove from cache
    for (const [hash, hint] of this.hintCache.entries()) {
      if (hint.id === hintId) {
        this.hintCache.delete(hash);
        break;
      }
    }
    
    // Mark as retired in database
    await this.markHintAsRetired(hintId, reason);
  }

  private generateErrorSignatureHash(signature: ErrorSignature): string {
    // Create deterministic hash for cache lookup
    const hashInput = `${signature.capsule_id}:${signature.test_case_id}:${signature.error_type}:${signature.error_message}`;
    return crypto.createHash('md5').update(hashInput).digest('hex');
  }

  private async getCachedHint(signatureHash: string): Promise<MentorHint | null> {
    // Check in-memory cache first (fastest)
    const memoryHit = this.hintCache.get(signatureHash);
    if (memoryHit) {
      return memoryHit;
    }

    // Check database cache
    const dbHint = await this.getHintFromDatabase(signatureHash);
    if (dbHint) {
      // Load into memory cache for next time
      this.hintCache.set(signatureHash, dbHint);
      return dbHint;
    }

    return null;
  }

  private async generateNewHint(request: MentorRequest, signatureHash: string): Promise<MentorHint> {
    const mentorPrompt = this.buildMentorPrompt(request);
    
    console.log(`[AIMentor] Generating new hint for error: ${request.error_signature.error_type}`);
    
    // Call AI service (this is the expensive part - but only happens once per unique error)
    const aiResponse = await this.aiService.complete({
      model: this.config.ai_model,
      messages: [{ role: 'user', content: mentorPrompt }],
      temperature: this.config.temperature,
      max_tokens: 100
    });

    let hintText = aiResponse.content.trim();
    
    // Ensure hint fits UI constraints
    if (hintText.length > this.config.max_hint_length) {
      hintText = hintText.substring(0, this.config.max_hint_length - 3) + '...';
    }

    // Create new hint object
    const newHint: MentorHint = {
      id: this.generateHintId(),
      error_signature_hash: signatureHash,
      hint_text: hintText,
      confidence_score: aiResponse.confidence || 0.8,
      created_at: new Date(),
      usage_count: 1,
      learner_feedback: {
        helpful_votes: 0,
        unhelpful_votes: 0
      },
      capsule_id: request.capsule_id,
      test_case_id: request.test_case_id,
      error_type: request.error_signature.error_type
    };

    return newHint;
  }

  private buildMentorPrompt(request: MentorRequest): string {
    return `You are an expert programming tutor. A student's code failed a test case.

**Student's Code:**
\`\`\`
${request.submitted_code}
\`\`\`

**Error:** ${request.error_signature.error_message}
**Test Case:** ${request.test_case_id}

Give the student ONE sentence Socratic hint to help them debug this error. DO NOT give them the answer or solution. Help them think through the problem themselves.

Requirements:
- Maximum 150 characters
- Be encouraging and supportive
- Ask a guiding question when possible
- Focus on the debugging process, not the solution
- Use simple, clear language

Hint:`;
  }

  private async cacheHint(hint: MentorHint): Promise<void> {
    // Add to in-memory cache
    this.hintCache.set(hint.error_signature_hash, hint);
    
    // Persist to database
    await this.saveHintToDatabase(hint);
  }

  private updateStats(cacheHit: boolean, responseTime: number, costSaved: number): void {
    // Update cache hit rate
    const totalRequests = this.stats.total_requests;
    const currentHits = this.stats.cache_hit_rate * (totalRequests - 1);
    this.stats.cache_hit_rate = (currentHits + (cacheHit ? 1 : 0)) / totalRequests;
    
    // Update average response time
    const currentAvg = this.stats.avg_response_time_ms;
    this.stats.avg_response_time_ms = (currentAvg * 0.9) + (responseTime * 0.1);
    
    // Update cost savings
    this.stats.total_cost_saved += costSaved;
  }

  private generateHintId(): string {
    return `hint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Database operations (placeholders - implement with your database)
  private async loadCacheFromDatabase(): Promise<void> {
    // TODO: Load frequently used hints into memory cache on startup
    console.log('[AIMentor] Loading hint cache from database...');
  }

  private async getHintFromDatabase(signatureHash: string): Promise<MentorHint | null> {
    // TODO: Query database for cached hint
    return null;
  }

  private async getHintById(hintId: string): Promise<MentorHint | null> {
    // TODO: Query database for hint by ID
    return null;
  }

  private async saveHintToDatabase(hint: MentorHint): Promise<void> {
    // TODO: Save new hint to database
    console.log(`[AIMentor] Saving hint to database: ${hint.id}`);
  }

  private async updateHintInDatabase(hint: MentorHint): Promise<void> {
    // TODO: Update existing hint in database
    console.log(`[AIMentor] Updating hint in database: ${hint.id}`);
  }

  private async updateHintUsage(hintId: string): Promise<void> {
    // TODO: Increment usage count for cached hint
    console.log(`[AIMentor] Incrementing usage for hint: ${hintId}`);
  }

  private async markHintAsRetired(hintId: string, reason: string): Promise<void> {
    // TODO: Mark hint as retired in database
    console.log(`[AIMentor] Marking hint as retired: ${hintId} - ${reason}`);
  }
}

// Export factory function
export function createAIMentor(aiService: any, config?: Partial<MentorConfig>): AIMentor {
  return new AIMentor(aiService, config);
}