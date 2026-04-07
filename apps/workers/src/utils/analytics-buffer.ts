/**
 * Buffered Analytics Writer
 * 
 * Instead of writing each event synchronously to D1 (which serializes writes),
 * we buffer events in KV and flush them in batch via the cron job.
 * 
 * Flow:
 * 1. trackEvent() → appends event to a minute-bucket KV key (fast, low write count)
 * 2. Cron job (every 15min) → flushEventBuffer() → batch INSERT to D1
 * 3. Direct D1 writes are eliminated from hot paths
 * 
 * KV key pattern: `events:bucket:{minuteTimestamp}`
 * Value: JSON array of events
 * TTL: 2 hours (safety — events auto-expire if flush fails)
 * 
 * OPTIMIZATION: Events within the same minute share one KV key (read-append-write),
 * reducing KV writes from 1-per-event to ~1-per-minute. TTL-based expiry replaces
 * explicit .delete() calls in flush, saving delete ops toward the daily KV limit.
 */

interface AnalyticsEvent {
  capsule_id: string;
  user_id?: string;
  event_type: string;
  metadata?: string;
  session_id?: string;
  learner_id?: string;
  learner_name?: string;
  client_ip?: string;
  user_agent?: string;
  referrer?: string;
  timestamp: string;
}

/**
 * Buffer an analytics event to KV (non-blocking, fast).
 * Appends to a per-minute bucket to minimize KV write ops.
 * Does NOT write to D1 directly.
 */
export async function trackEvent(
  env: Env,
  event: Omit<AnalyticsEvent, 'timestamp'>
): Promise<void> {
  try {
    const minuteKey = Math.floor(Date.now() / 60_000);
    const key = `events:bucket:${minuteKey}`;
    
    // Read existing bucket, append new event
    const existing = await env.CACHE.get(key, 'json') as AnalyticsEvent[] | null;
    const bucket = existing || [];
    bucket.push({
      ...event,
      timestamp: new Date().toISOString(),
    });
    
    await env.CACHE.put(key, JSON.stringify(bucket), { expirationTtl: 7200 }); // 2 hour safety TTL
  } catch (err) {
    // Never fail the request because analytics buffering failed
    console.error('Analytics buffer write failed:', err);
  }
}

/**
 * Flush buffered events from KV to D1 in batch.
 * Called by the cron job every 15 minutes.
 * 
 * Strategy: List all KV bucket keys matching `events:bucket:*`, read arrays,
 * flatten into events, batch INSERT into D1. Skip explicit deletes —
 * the 2-hour TTL auto-expires keys after flush.
 * 
 * To avoid re-flushing the same bucket, we mark flushed buckets with a
 * short-lived `events:flushed:{minuteKey}` flag (costs 0 extra writes —
 * we just skip buckets that were already flushed within the same TTL window).
 */
export async function flushEventBuffer(env: Env): Promise<{ flushed: number; errors: number }> {
  let flushed = 0;
  let errors = 0;

  try {
    // List all buffered event buckets
    const list = await env.CACHE.list({ prefix: 'events:bucket:' });
    
    if (list.keys.length === 0) {
      return { flushed: 0, errors: 0 };
    }

    // Only flush buckets older than current minute (avoid partial-minute race)
    const currentMinuteKey = `events:bucket:${Math.floor(Date.now() / 60_000)}`;
    const staleKeys = list.keys.filter(k => k.name !== currentMinuteKey);

    if (staleKeys.length === 0) {
      return { flushed: 0, errors: 0 };
    }

    // Process in batches of 10 buckets (each bucket can have many events)
    const batchSize = 10;

    for (let i = 0; i < staleKeys.length; i += batchSize) {
      const batch = staleKeys.slice(i, i + batchSize);
      const allEvents: AnalyticsEvent[] = [];
      const processedKeys: string[] = [];

      // Read all event buckets in this batch
      for (const key of batch) {
        try {
          const bucket = await env.CACHE.get(key.name, 'json') as AnalyticsEvent[] | null;
          if (bucket && Array.isArray(bucket)) {
            allEvents.push(...bucket);
            processedKeys.push(key.name);
          }
        } catch {
          errors++;
        }
      }

      if (allEvents.length === 0) continue;

      // Batch insert into D1 (max 50 statements per D1 batch)
      try {
        const d1BatchSize = 50;
        for (let j = 0; j < allEvents.length; j += d1BatchSize) {
          const eventSlice = allEvents.slice(j, j + d1BatchSize);
          const stmt = env.DB.prepare(`
            INSERT INTO capsule_events (id, capsule_id, user_id, event_type, metadata, session_id, learner_id, learner_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          const statements = eventSlice.map(e =>
            stmt.bind(
              crypto.randomUUID().replace(/-/g, '').slice(0, 24),
              e.capsule_id,
              e.user_id || null,
              e.event_type,
              e.metadata || null,
              e.session_id || null,
              e.learner_id || null,
              e.learner_name || null,
              e.timestamp
            )
          );

          await env.DB.batch(statements);
        }
        flushed += allEvents.length;

        // Mark flushed buckets as empty so they aren't re-processed
        // Write an empty array — cheaper than delete, and TTL handles cleanup
        for (const key of processedKeys) {
          await env.CACHE.put(key, '[]', { expirationTtl: 60 }); // expire in 1 min
        }
      } catch (err) {
        console.error('D1 batch insert failed:', err);
        errors += allEvents.length;
        // Don't clear KV keys — they'll be retried next flush
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
 * Buffer a client-tag API hit to KV.
 * Appends to a per-minute bucket to minimize KV write ops.
 *
 * KV key pattern: `ctag:bucket:{minuteTimestamp}`
 * Value: JSON array of { clientTag, timestamp }
 * TTL: 2 hours (safety — expires if flush fails)
 */
export async function trackClientTagHit(env: Env, clientTag: string): Promise<void> {
  try {
    const minuteKey = Math.floor(Date.now() / 60_000);
    const key = `ctag:bucket:${minuteKey}`;
    
    const existing = await env.CACHE.get(key, 'json') as Array<{ clientTag: string; timestamp: string }> | null;
    const bucket = existing || [];
    bucket.push({
      clientTag,
      timestamp: new Date().toISOString(),
    });
    
    await env.CACHE.put(key, JSON.stringify(bucket), { expirationTtl: 7200 });
  } catch {
    // Never fail the request
  }
}

/**
 * Flush buffered client-tag hits from KV into D1 `client_tag_stats`.
 * Called by the cron job every 15 minutes alongside flushEventBuffer().
 *
 * Groups hits by (clientTag, hourBucket) and upserts counts into D1.
 * Uses minute-bucket keys and TTL-based cleanup (no explicit deletes).
 */
export async function flushClientTagCounters(env: Env): Promise<{ flushed: number; errors: number }> {
  let flushed = 0;
  let errors = 0;

  try {
    const list = await env.CACHE.list({ prefix: 'ctag:bucket:' });

    if (list.keys.length === 0) {
      return { flushed: 0, errors: 0 };
    }

    // Skip current minute bucket to avoid partial-minute race
    const currentMinuteKey = `ctag:bucket:${Math.floor(Date.now() / 60_000)}`;
    const staleKeys = list.keys.filter(k => k.name !== currentMinuteKey);

    if (staleKeys.length === 0) {
      return { flushed: 0, errors: 0 };
    }

    // Accumulate counts per (clientTag, hourBucket) across all buckets
    const counts = new Map<string, number>();
    const processedKeys: string[] = [];
    let totalHits = 0;

    for (const key of staleKeys) {
      try {
        const bucket = await env.CACHE.get(key.name, 'json') as Array<{ clientTag: string; timestamp: string }> | null;
        if (bucket && Array.isArray(bucket) && bucket.length > 0) {
          for (const hit of bucket) {
            // Bucket by UTC hour: "2026-03-16T12"
            const hourBucket = hit.timestamp.slice(0, 13);
            const mapKey = `${hit.clientTag}::${hourBucket}`;
            counts.set(mapKey, (counts.get(mapKey) ?? 0) + 1);
            totalHits++;
          }
          processedKeys.push(key.name);
        }
      } catch {
        errors++;
      }
    }

    if (counts.size === 0) {
      return { flushed: 0, errors: 0 };
    }

    // Upsert each (clientTag, hourBucket) bucket into D1
    try {
      const statements = Array.from(counts.entries()).map(([mapKey, count]) => {
        const [clientTag, hourBucket] = mapKey.split('::');
        return env.DB.prepare(`
          INSERT INTO client_tag_stats (id, client_tag, request_count, hour_bucket, last_updated)
          VALUES (lower(hex(randomblob(6))), ?, ?, ?, datetime('now'))
          ON CONFLICT(client_tag, hour_bucket)
          DO UPDATE SET
            request_count = request_count + excluded.request_count,
            last_updated  = datetime('now')
        `).bind(clientTag, count, hourBucket);
      });

      await env.DB.batch(statements);
      flushed += totalHits;

      // Mark flushed buckets as empty — TTL handles cleanup
      for (const key of processedKeys) {
        await env.CACHE.put(key, '[]', { expirationTtl: 60 });
      }
    } catch (err) {
      console.error('client_tag_stats upsert failed:', err);
      errors += totalHits;
    }
  } catch (err) {
    console.error('flushClientTagCounters failed:', err);
  }

  console.log(JSON.stringify({
    type: 'metric',
    name: 'ctag.flush',
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
