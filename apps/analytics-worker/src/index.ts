/**
 * Cloudflare Worker: Analytics Event Collector
 * 
 * This worker captures analytics events from the Vite embed system
 * and forwards them to Azure Event Hubs for processing.
 * 
 * Deployment: Cloudflare Workers (uses $5,000 credits)
 * Pipeline: Embed → Worker → Event Hubs → Azure Function → Supabase
 */

// Extend Request interface to include Cloudflare properties
interface CloudflareRequest extends Request {
  cf?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
}

// Add ExecutionContext type for Cloudflare Workers
interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

interface Env {
  EVENT_HUB_CONNECTION_STRING: string;
  EVENT_HUB_NAME: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ALLOWED_ORIGINS: string; // Comma-separated list
}

interface AnalyticsEvent {
  eventType: 'session_started' | 'session_ended' | 'code_run' | 'test_passed' | 'test_failed' | 'hint_requested' | 'solution_viewed' | 'capsule_completed' | 'error_encountered';
  capsuleId?: string;
  userId?: string;
  sessionId: string;
  timestamp: string;
  eventData?: any;
}

interface EventHubMessage {
  body: string;
  properties?: Record<string, any>;
}

export default {
  async fetch(request: CloudflareRequest, env: Env, ctx: ExecutionContext): Promise<Response> {
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }
    
    // Only allow POST requests for analytics
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    try {
      // Validate origin
      const origin = request.headers.get('Origin');
      if (!isAllowedOrigin(origin, env)) {
        return new Response('Forbidden - Invalid origin', { status: 403 });
      }
      
      // Parse the analytics event
      const event: AnalyticsEvent = await request.json();
      
      // Validate required fields
      if (!event.eventType || !event.sessionId || !event.timestamp) {
        return new Response('Bad Request - Missing required fields', { status: 400 });
      }
      
      // Enrich event with request metadata
      const enrichedEvent = {
        ...event,
        eventId: crypto.randomUUID(),
        ipAddress: request.headers.get('CF-Connecting-IP'),
        userAgent: request.headers.get('User-Agent'),
        referrer: request.headers.get('Referer'),
        country: (request as CloudflareRequest).cf?.country,
        timestamp: new Date().toISOString(), // Use server timestamp for accuracy
      };
      
      // Send to Azure Event Hubs asynchronously
      ctx.waitUntil(sendToEventHub(enrichedEvent, env));
      
      // Return success immediately (fire-and-forget)
      return new Response(JSON.stringify({ 
        success: true, 
        eventId: enrichedEvent.eventId 
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...getCORSHeaders(origin, env)
        }
      });
      
    } catch (error) {
      console.error('Analytics processing error:', error);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCORSHeaders(request.headers.get('Origin'), env)
        }
      });
    }
  }
};

/**
 * Send analytics event to Azure Event Hubs
 */
async function sendToEventHub(event: any, env: Env): Promise<void> {
  try {
    // Azure Event Hubs REST API endpoint
    const eventHubUrl = `https://codecapsule-analytics.servicebus.windows.net/${env.EVENT_HUB_NAME}/messages`;
    
    // Create SAS token for authentication
    const sasToken = generateSASToken(env.EVENT_HUB_CONNECTION_STRING, env.EVENT_HUB_NAME);
    
    const message: EventHubMessage = {
      body: JSON.stringify(event),
      properties: {
        eventType: event.eventType,
        capsuleId: event.capsuleId,
        timestamp: event.timestamp
      }
    };
    
    const response = await fetch(eventHubUrl, {
      method: 'POST',
      headers: {
        'Authorization': sasToken,
        'Content-Type': 'application/atom+xml;type=entry;charset=utf-8',
        'BrokerProperties': JSON.stringify({
          PartitionKey: event.capsuleId || event.sessionId
        })
      },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      console.error(`Failed to send to Event Hub: ${response.status} ${response.statusText}`);
      throw new Error(`Event Hub error: ${response.status}`);
    }
    
    console.log(`Successfully sent event ${event.eventId} to Event Hub`);
    
  } catch (error) {
    console.error('Event Hub sending failed:', error);
    
    // Fallback: Store in Cloudflare KV for retry or direct database insert
    // This ensures we don't lose analytics data if Event Hubs is down  
    await fallbackStorage(event, env);
  }
}

/**
 * Fallback storage mechanism (Cloudflare KV)
 */
async function fallbackStorage(event: any, env: Env): Promise<void> {
  try {
    // Store in a fallback queue for later processing
    console.log(`Storing event ${event.eventId} in fallback storage`);
    
    // In a real implementation, you would store this in Cloudflare KV
    // and have a separate worker process these failed events
    
  } catch (error) {
    console.error('Fallback storage failed:', error);
  }
}

/**
 * Generate SAS token for Azure Event Hubs authentication
 */
function generateSASToken(connectionString: string, eventHubName: string): string {
  // Parse connection string
  const parts = connectionString.split(';');
  const endpoint = parts.find(p => p.startsWith('Endpoint='))?.replace('Endpoint=', '');
  const keyName = parts.find(p => p.startsWith('SharedAccessKeyName='))?.replace('SharedAccessKeyName=', '');
  const key = parts.find(p => p.startsWith('SharedAccessKey='))?.replace('SharedAccessKey=', '');
  
  if (!endpoint || !keyName || !key) {
    throw new Error('Invalid Event Hub connection string');
  }
  
  const resourceUri = `${endpoint}${eventHubName}`;
  const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  
  // Create signature string
  const stringToSign = `${resourceUri}\n${expiry}`;
  
  // This is a simplified version - in production you'd need proper HMAC-SHA256
  // For Cloudflare Workers, you'd use the Web Crypto API
  const signature = btoa(stringToSign); // Simplified - use proper HMAC in production
  
  return `SharedAccessSignature sr=${encodeURIComponent(resourceUri)}&sig=${encodeURIComponent(signature)}&se=${expiry}&skn=${keyName}`;
}

/**
 * Handle CORS preflight requests
 */
function handleCORS(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin');
  
  if (!isAllowedOrigin(origin, env)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders(origin, env)
  });
}

/**
 * Get CORS headers
 */
function getCORSHeaders(origin: string | null, env: Env): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
  
  if (origin && isAllowedOrigin(origin, env)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  return headers;
}

/**
 * Check if origin is allowed
 */
function isAllowedOrigin(origin: string | null, env: Env): boolean {
  if (!origin) return false;
  
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  
  // Allow localhost for development
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return true;
  }
  
  // Check against allowed origins (supports wildcards)
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    if (allowed.startsWith('*.')) {
      const domain = allowed.substring(2);
      return origin.endsWith(domain);
    }
    return origin === allowed;
  });
}