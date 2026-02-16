/**
 * Buffered Analytics Writer
 * 
 * Instead of writing each event synchronously to D1 (which serializes writes),
 * we buffer events in KV and flush them in batch via the cron job.
 * 
 * Flow:
 * 1. trackEvent() → writes event to KV buffer (fast, no write contention)
 * 2. Cron job (every 15min) → flushEventBuffer() → batch INSERT to D1
 * 3. Direct D1 writes are eliminated from hot paths
 * 
 * KV key pattern: `events:buffer:{timestamp}:{random}`
 * Value: JSON event object
 * TTL: 1 hour (safety — events auto-expire if flush fails)
 */

interface AnalyticsEvent {
  capsule_id: string;
  user_id?: string;
  event_type: string;
  metadata?: string;
  session_id?: string;
  client_ip?: string;
  user_agent?: string;
  referrer?: string;
  timestamp: string;
}

/**
 * Buffer an analytics event to KV (non-blocking, fast).
 * Does NOT write to D1 directly.
 */
export async function trackEvent(
  env: Env,
  event: Omit<AnalyticsEvent, 'timestamp'>
): Promise<void> {
  try {
    const key = `events:buffer:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
    await env.CACHE.put(key, JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
    }), { expirationTtl: 3600 }); // 1 hour safety TTL
  } catch (err) {
    // Never fail the request because analytics buffering failed
    console.error('Analytics buffer write failed:', err);
  }
}

/**
 * Flush buffered events from KV to D1 in batch.
 * Called by the cron job every 15 minutes.
 * 
 * Strategy: List all KV keys matching `events:buffer:*`, read values,
 * batch INSERT into D1, then delete the KV keys.
 */
export async function flushEventBuffer(env: Env): Promise<{ flushed: number; errors: number }> {
  let flushed = 0;
  let errors = 0;

  try {
    // List all buffered events
    const list = await env.CACHE.list({ prefix: 'events:buffer:' });
    
    if (list.keys.length === 0) {
      return { flushed: 0, errors: 0 };
    }

    // Process in batches of 50 (D1 batch limit)
    const batchSize = 50;
    const keys = list.keys;

    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      const events: AnalyticsEvent[] = [];
      const keysToDelete: string[] = [];

      // Read all events in this batch
      for (const key of batch) {
        try {
          const value = await env.CACHE.get(key.name, 'json') as AnalyticsEvent | null;
          if (value) {
            events.push(value);
            keysToDelete.push(key.name);
          }
        } catch {
          errors++;
        }
      }

      if (events.length === 0) continue;

      // Batch insert into D1
      try {
        const stmt = env.DB.prepare(`
          INSERT INTO capsule_events (id, capsule_id, user_id, event_type, metadata, session_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const statements = events.map(e =>
          stmt.bind(
            crypto.randomUUID().slice(0, 24),
            e.capsule_id,
            e.user_id || null,
            e.event_type,
            e.metadata || null,
            e.session_id || null,
            e.timestamp
          )
        );

        await env.DB.batch(statements);
        flushed += events.length;

        // Delete flushed keys from KV
        for (const key of keysToDelete) {
          await env.CACHE.delete(key);
        }
      } catch (err) {
        console.error('D1 batch insert failed:', err);
        errors += events.length;
        // Don't delete KV keys — they'll be retried next flush
      }
    }
  } catch (err) {
    console.error('Event buffer flush failed:', err);
  }

  console.log(JSON.stringify({
    type: 'metric',
    name: 'analytics.flush',
    flushed,
    errors,
    timestamp: new Date().toISOString(),
  }));

  return { flushed, errors };
}

/**
 * Track execution metric to KV buffer (for execute routes).
 * Lightweight — no D1 write on hot path.
 */
export async function trackExecution(
  env: Env,
  userId: string | undefined,
  language: string,
  success: boolean,
  executionTime: number,
  tier: string
): Promise<void> {
  // Log to structured logging (always)
  console.log(JSON.stringify({
    type: 'metric',
    name: 'execution',
    tags: { language, success: String(success), tier },
    value: executionTime,
    timestamp: Date.now(),
  }));

  // Buffer the event for D1 (sampled: 1 in 5 for execution events)
  if (Math.random() < 0.2) {
    await trackEvent(env, {
      capsule_id: 'system:execution',
      user_id: userId,
      event_type: 'run',
      metadata: JSON.stringify({ language, success, executionTime, tier }),
    });
  }
}
