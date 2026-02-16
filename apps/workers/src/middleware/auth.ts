/**
 * Authentication Middleware
 * 
 * Supports two authentication methods:
 * 1. JWT tokens (for dashboard users)
 * 2. API keys (for embed widget + API consumers)
 * 
 * API keys are prefixed with 'dk_' (devcapsules key)
 */

import { createMiddleware } from 'hono/factory';
import * as jose from 'jose';
import { ApiError } from './error-handler';

// Exact-match public routes (Set lookup — O(1), no prefix injection risk)
const PUBLIC_ROUTES = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/callback',
  '/api/v1/execute',          // Execute (rate limited instead)
]);

// Prefix-based public routes (use trailing slash to prevent injection)
const PUBLIC_PREFIXES = [
  '/api/v1/capsules/public/', // Only truly public capsule routes
];

// Prefix-based optional auth routes
const OPTIONAL_AUTH_PREFIXES = [
  '/api/v1/capsules/',        // GET individual capsule
  '/api/v1/analytics/public/',
];

export const authMiddleware = createMiddleware<{ 
  Bindings: Env; 
  Variables: { auth: Auth | null; requestId: string } 
}>(async (c, next) => {
  const path = c.req.path;
  const method = c.req.method;

  // Check if route is public (exact match + safe prefix match)
  const isExactPublic = PUBLIC_ROUTES.has(path);
  const isPrefixPublic = PUBLIC_PREFIXES.some(route => path.startsWith(route));
  const isPublicCapsuleGet = path === '/api/v1/capsules' && method === 'GET';
  const isPublic = isExactPublic || isPrefixPublic || isPublicCapsuleGet;

  // Check if auth is optional
  const isOptional = OPTIONAL_AUTH_PREFIXES.some(route => path.startsWith(route));

  // Get authorization header
  const authHeader = c.req.header('Authorization');

  // No auth header
  if (!authHeader) {
    if (isPublic || isOptional) {
      c.set('auth', null);
      await next();
      return;
    }
    throw new ApiError(401, 'Authentication required');
  }

  // Parse auth header
  if (!authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Invalid authorization header format');
  }

  const token = authHeader.slice(7);

  try {
    // API Key authentication (dk_xxxxx)
    if (token.startsWith('dk_')) {
      const auth = await authenticateApiKey(c.env, token);
      c.set('auth', auth);
      await next();
      return;
    }

    // JWT authentication
    const auth = await authenticateJWT(c.env, token);
    c.set('auth', auth);
    await next();
  } catch (error) {
    if (isOptional) {
      c.set('auth', null);
      await next();
      return;
    }
    throw error;
  }
});

/**
 * Authenticate API Key
 */
async function authenticateApiKey(env: Env, apiKey: string): Promise<Auth> {
  // Hash the API key for lookup
  const keyHash = await hashKey(apiKey);
  
  // Look up in SESSIONS KV
  const keyData = await env.SESSIONS.get(`apikey:${keyHash}`, 'json') as {
    userId: string;
    email: string;
    plan: Auth['plan'];
    createdAt: number;
    lastUsed?: number;
  } | null;

  if (!keyData) {
    throw new ApiError(401, 'Invalid API key');
  }

  // WRITE-THROTTLE: Only update KV if lastUsed is older than 12 hours (43,200,000 ms)
  // Saves massive KV write costs — 1 write/12h instead of 1 write/request
  const now = Date.now();
  if (!keyData.lastUsed || (now - keyData.lastUsed > 43_200_000)) {
    env.SESSIONS.put(`apikey:${keyHash}`, JSON.stringify({
      ...keyData,
      lastUsed: now,
    })).catch((err) => console.error('Failed to update API key lastUsed:', err));
  }

  return {
    userId: keyData.userId,
    email: keyData.email,
    plan: keyData.plan,
    isApiKey: true,
  };
}

/**
 * Authenticate JWT Token
 * 
 * Supports two JWT types:
 * 1. Workers-issued JWTs (signed with JWT_SECRET, issuer='devcapsules')
 * 2. Supabase JWTs (signed with SUPABASE_JWT_SECRET, issuer contains 'supabase')
 */
async function authenticateJWT(env: Env, token: string): Promise<Auth> {
  // Try Supabase JWT first (most common for dashboard users)
  if (env.SUPABASE_JWT_SECRET) {
    try {
      const supabaseAuth = await authenticateSupabaseJWT(env, token);
      return supabaseAuth;
    } catch {
      // Not a valid Supabase JWT, try Workers JWT
    }
  }

  // Try Workers-issued JWT
  if (env.JWT_SECRET) {
    try {
      const secret = new TextEncoder().encode(env.JWT_SECRET);
      
      const { payload } = await jose.jwtVerify(token, secret, {
        issuer: 'devcapsules',
        audience: 'devcapsules-api',
      });

      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new ApiError(401, 'Token expired');
      }

      return {
        userId: payload.sub as string,
        email: payload.email as string,
        plan: (payload.plan as Auth['plan']) || 'free',
        isApiKey: false,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, 'Invalid token');
    }
  }

  throw new ApiError(401, 'No JWT verification keys configured');
}

/**
 * Authenticate Supabase JWT Token
 * Verifies tokens issued by Supabase Auth and auto-provisions users in D1
 */
async function authenticateSupabaseJWT(env: Env, token: string): Promise<Auth> {
  const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
  
  const { payload } = await jose.jwtVerify(token, secret, {
    audience: 'authenticated',
  });

  if (payload.exp && payload.exp < Date.now() / 1000) {
    throw new ApiError(401, 'Token expired');
  }

  const supabaseUserId = payload.sub as string;
  const email = payload.email as string;

  if (!supabaseUserId || !email) {
    throw new ApiError(401, 'Invalid Supabase token claims');
  }

  // Auto-provision: ensure user exists in D1 (upsert by supabase_id or email)
  let user = await env.DB.prepare(
    'SELECT id, email, plan FROM users WHERE id = ? OR email = ?'
  ).bind(supabaseUserId, email).first<{ id: string; email: string; plan: Auth['plan'] }>();

  if (!user) {
    // Auto-create user in D1 from Supabase claims
    const name = (payload.user_metadata as any)?.full_name
              || (payload.user_metadata as any)?.name
              || email.split('@')[0];
    
    // Extract provider from Supabase app_metadata (email, github, google)
    const provider = (payload.app_metadata as any)?.provider || 'email';
    const validProviders = ['email', 'github', 'google'];
    const authProvider = validProviders.includes(provider) ? provider : 'email';
    
    await env.DB.prepare(`
      INSERT INTO users (id, email, name, auth_provider, plan)
      VALUES (?, ?, ?, ?, 'free')
    `).bind(supabaseUserId, email, name, authProvider).run();

    user = { id: supabaseUserId, email, plan: 'free' };
  }

  return {
    userId: user.id,
    email: user.email,
    plan: user.plan || 'free',
    isApiKey: false,
  };
}

/**
 * Hash API key for secure storage lookup
 */
async function hashKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a new API key
 */
export async function generateApiKey(): Promise<string> {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const key = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `dk_${key}`;
}

/**
 * Generate JWT token
 */
export async function generateJWT(
  env: Env,
  payload: { userId: string; email: string; plan: Auth['plan'] }
): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  
  const token = await new jose.SignJWT({
    sub: payload.userId,
    email: payload.email,
    plan: payload.plan,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('devcapsules')
    .setAudience('devcapsules-api')
    .setExpirationTime('7d')
    .sign(secret);

  return token;
}
