import { app, InvocationContext, Timer } from '@azure/functions';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AnalyticsEvent {
  eventId: string;
  eventType: 'session_started' | 'session_ended' | 'code_run' | 'test_passed' | 'test_failed' | 'hint_requested' | 'solution_viewed' | 'capsule_completed' | 'error_encountered';
  capsuleId?: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  eventData?: any;
}

/**
 * Azure Event Hubs Trigger Function
 * Processes analytics events in real-time from Cloudflare Workers
 */
export async function processAnalyticsEvents(messages: unknown, context: InvocationContext): Promise<void> {
    const eventHubMessages = Array.isArray(messages) ? messages as any[] : [messages];
    context.log(`Processing ${eventHubMessages.length} analytics events`);
    
    const batchId = randomUUID();
    const processedEvents: any[] = [];
    
    try {
        // Parse and validate events
        for (const message of eventHubMessages) {
            try {
                const event: AnalyticsEvent = typeof message === 'string' ? JSON.parse(message) : message;
                
                // Validate required fields
                if (!event.eventType || !event.timestamp) {
                    context.log(`Skipping invalid event: ${JSON.stringify(event)}`);
                    continue;
                }
                
                processedEvents.push({
                    eventId: event.eventId || randomUUID(),
                    eventType: event.eventType,
                    capsuleId: event.capsuleId || null,
                    userId: event.userId || null,
                    sessionId: event.sessionId || null,
                    timestamp: new Date(event.timestamp),
                    ipAddress: event.ipAddress || null,
                    userAgent: event.userAgent || null,
                    referrer: event.referrer || null,
                    eventData: event.eventData || null,
                    processed: false,
                    batchId: batchId
                });
                
            } catch (parseError) {
                context.log(`Failed to parse event: ${parseError}`);
                continue;
            }
        }
        
        if (processedEvents.length === 0) {
            context.log('No valid events to process');
            return;
        }
        
        // Bulk insert raw events into Supabase using raw SQL
        for (const event of processedEvents) {
            try {
                await prisma.$executeRaw`
                    INSERT INTO analytics.event_stream (
                        event_id, event_type, capsule_id, user_id, session_id,
                        timestamp, ip_address, user_agent, referrer, event_data,
                        processed, batch_id
                    ) VALUES (
                        ${event.eventId}::uuid, ${event.eventType}, ${event.capsuleId}::uuid,
                        ${event.userId}::uuid, ${event.sessionId}, ${event.timestamp},
                        ${event.ipAddress}::inet, ${event.userAgent}, ${event.referrer},
                        ${event.eventData}::jsonb, ${event.processed}, ${event.batchId}::uuid
                    ) ON CONFLICT (event_id) DO NOTHING
                `;
            } catch (insertError) {
                context.log(`Failed to insert event ${event.eventId}: ${insertError}`);
            }
        }
        
        context.log(`Successfully processed ${processedEvents.length} events`);
        
        // Trigger hourly aggregation for recent events
        await triggerHourlyAggregation(context);
        
    } catch (error) {
        context.error(`Failed to process analytics events: ${error}`);
        throw error;
    }
}

/**
 * Timer Trigger Function - runs every hour to aggregate analytics
 */
export async function hourlyAnalyticsAggregation(myTimer: Timer, context: InvocationContext): Promise<void> {
    context.log('Starting hourly analytics aggregation');
    
    try {
        const now = new Date();
        const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 1, 0, 0, 0);
        const hourEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
        
        context.log(`Aggregating events from ${hourStart.toISOString()} to ${hourEnd.toISOString()}`);
        
        // Get unique capsules that had events in this period
        const capsules = await prisma.$queryRaw<{capsule_id: string}[]>`
            SELECT DISTINCT capsule_id::text 
            FROM analytics.event_stream 
            WHERE timestamp >= ${hourStart} 
            AND timestamp < ${hourEnd} 
            AND processed = false
            AND capsule_id IS NOT NULL
        `;
        
        let processedCount = 0;
        const hourBucket = new Date(hourStart.getFullYear(), hourStart.getMonth(), hourStart.getDate(), hourStart.getHours(), 0, 0, 0);
        
        // Process each capsule's events for the hour
        for (const capsule of capsules) {
            const stats = await prisma.$queryRaw<{total_sessions: number, unique_users: number, total_runs: number, successful_runs: number}[]>`
                SELECT 
                    COUNT(DISTINCT session_id) as total_sessions,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(CASE WHEN event_type = 'code_run' THEN 1 END) as total_runs,
                    COUNT(CASE WHEN event_type = 'test_passed' THEN 1 END) as successful_runs
                FROM analytics.event_stream
                WHERE capsule_id = ${capsule.capsule_id}::uuid
                AND timestamp >= ${hourStart} 
                AND timestamp < ${hourEnd}
                AND processed = false
            `;
            
            if (stats.length > 0 && stats[0]) {
                const stat = stats[0];
                // Insert or update hourly stats
                await prisma.$executeRaw`
                    INSERT INTO analytics.capsule_hourly_stats (
                        capsule_id, hour_bucket, total_sessions, unique_users, total_runs, successful_runs
                    ) VALUES (
                        ${capsule.capsule_id}::uuid, ${hourBucket}, ${stat.total_sessions}, 
                        ${stat.unique_users}, ${stat.total_runs}, ${stat.successful_runs}
                    ) ON CONFLICT (capsule_id, hour_bucket) 
                    DO UPDATE SET 
                        total_sessions = EXCLUDED.total_sessions,
                        unique_users = EXCLUDED.unique_users,
                        total_runs = EXCLUDED.total_runs,
                        successful_runs = EXCLUDED.successful_runs,
                        updated_at = NOW()
                `;
                processedCount++;
            }
        }
        
        // Mark events as processed
        await prisma.$executeRaw`
            UPDATE analytics.event_stream 
            SET processed = true, processed_at = NOW()
            WHERE timestamp >= ${hourStart} 
            AND timestamp < ${hourEnd} 
            AND processed = false
        `;
        
        context.log(`Processed ${processedCount} capsules in hourly aggregation`);
        
        // Update user daily stats
        await updateUserDailyStats(hourStart, hourEnd, context);
        
        // Clean up old events
        await cleanupOldEvents(context);
        
    } catch (error) {
        context.error(`Failed to run hourly aggregation: ${error}`);
        throw error;
    }
}

/**
 * Helper function to trigger aggregation
 */
async function triggerHourlyAggregation(context: InvocationContext): Promise<void> {
    try {
        const now = new Date();
        const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
        const previousHourStart = new Date(currentHourStart.getTime() - 60 * 60 * 1000);
        
        const result = await prisma.$queryRaw<{count: bigint}[]>`
            SELECT COUNT(*) as count
            FROM analytics.event_stream
            WHERE timestamp >= ${previousHourStart} 
            AND timestamp < ${currentHourStart}
            AND processed = false
        `;
        
        context.log(`Found ${result[0]?.count || 0} unprocessed events for aggregation`);
        
    } catch (error) {
        context.log(`Failed to trigger hourly aggregation: ${error}`);
    }
}

/**
 * Update user daily statistics
 */
async function updateUserDailyStats(hourStart: Date, hourEnd: Date, context: InvocationContext): Promise<void> {
    try {
        const today = new Date(hourStart.getFullYear(), hourStart.getMonth(), hourStart.getDate());
        
        const activeUsers = await prisma.$queryRaw<{user_id: string}[]>`
            SELECT DISTINCT user_id::text
            FROM analytics.event_stream
            WHERE timestamp >= ${hourStart}
            AND timestamp < ${hourEnd}
            AND user_id IS NOT NULL
            AND processed = false
        `;
        
        for (const user of activeUsers) {
            if (!user.user_id) continue;
            
            const userEvents = await prisma.$queryRaw<{event_type: string, capsule_id: string}[]>`
                SELECT event_type, capsule_id::text
                FROM analytics.event_stream
                WHERE user_id = ${user.user_id}::uuid
                AND timestamp >= ${today}
                AND timestamp < ${new Date(today.getTime() + 24 * 60 * 60 * 1000)}
            `;
            
            const capsulesAttempted = new Set(
                userEvents.filter(e => e.capsule_id && ['code_run', 'session_started'].includes(e.event_type))
                          .map(e => e.capsule_id)
            ).size;
            
            const capsulesCompleted = new Set(
                userEvents.filter(e => e.capsule_id && e.event_type === 'capsule_completed')
                          .map(e => e.capsule_id)
            ).size;
            
            const totalRuns = userEvents.filter(e => e.event_type === 'code_run').length;
            const successfulRuns = userEvents.filter(e => e.event_type === 'test_passed').length;
            const hintsUsed = userEvents.filter(e => e.event_type === 'hint_requested').length;
            
            await prisma.$executeRaw`
                INSERT INTO analytics.user_daily_stats (
                    user_id, date, capsules_attempted, capsules_completed, 
                    total_runs, successful_runs, hints_used
                ) VALUES (
                    ${user.user_id}::uuid, ${today}::date, ${capsulesAttempted}, ${capsulesCompleted},
                    ${totalRuns}, ${successfulRuns}, ${hintsUsed}
                ) ON CONFLICT (user_id, date) 
                DO UPDATE SET 
                    capsules_attempted = EXCLUDED.capsules_attempted,
                    capsules_completed = EXCLUDED.capsules_completed,
                    total_runs = EXCLUDED.total_runs,
                    successful_runs = EXCLUDED.successful_runs,
                    hints_used = EXCLUDED.hints_used,
                    updated_at = NOW()
            `;
        }
        
        context.log(`Updated daily stats for ${activeUsers.length} users`);
        
    } catch (error) {
        context.error(`Failed to update user daily stats: ${error}`);
    }
}

/**
 * Clean up old events (retention policy)
 */
async function cleanupOldEvents(context: InvocationContext): Promise<void> {
    try {
        await prisma.$executeRaw`
            DELETE FROM analytics.event_stream 
            WHERE processed = true 
            AND processed_at < NOW() - INTERVAL '7 days'
        `;
        
        await prisma.$executeRaw`
            DELETE FROM analytics.active_sessions 
            WHERE expires_at < NOW()
        `;
        
        context.log(`Cleaned up old events and expired sessions`);
        
    } catch (error) {
        context.error(`Failed to cleanup old events: ${error}`);
    }
}

// Register Azure Functions
app.eventHub('processAnalyticsEvents', {
    connection: 'EventHubConnection',
    eventHubName: 'codecapsule-analytics',
    cardinality: 'many',
    handler: processAnalyticsEvents
});

app.timer('hourlyAnalyticsAggregation', {
    schedule: '0 0 * * * *', // Every hour at minute 0
    handler: hourlyAnalyticsAggregation
});

// Health check endpoint
app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        return {
            status: 200,
            jsonBody: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
    }
});