/**
 * Auth Routes
 * 
 * Simple auth endpoints for login, register, and session management.
 */

import { Hono } from 'hono';
import { ApiError } from '../middleware/error-handler';
import { generateApiKey, generateJWT } from '../middleware/auth';

type Variables = {
  auth: Auth | null;
  requestId: string;
};

export const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ══════════════════════════════════════════════════════════════════════════════
// POST /auth/register — Register new user
// ══════════════════════════════════════════════════════════════════════════════

authRoutes.post('/register', async (c) => {
  const body = await c.req.json();
  const { email, name, password } = body;

  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  // Check if user exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first();

  if (existing) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const userId = crypto.randomUUID().slice(0, 24);
  await c.env.DB.prepare(`
    INSERT INTO users (id, email, name, password_hash, auth_provider)
    VALUES (?, ?, ?, ?, 'email')
  `).bind(userId, email, name || null, passwordHash).run();

  // Generate JWT
  const token = await generateJWT(c.env, {
    userId,
    email,
    plan: 'free',
  });

  return c.json({
    success: true,
    data: {
      user: { id: userId, email, name, plan: 'free' },
      token,
    },
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  }, 201);
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /auth/login — Login with email/password
// ══════════════════════════════════════════════════════════════════════════════

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  // Find user
  const user = await c.env.DB.prepare(
    'SELECT id, email, name, plan, password_hash FROM users WHERE email = ?'
  ).bind(email).first<{
    id: string;
    email: string;
    name: string | null;
    plan: Auth['plan'];
    password_hash: string;
  }>();

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Verify password
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate JWT
  const token = await generateJWT(c.env, {
    userId: user.id,
    email: user.email,
    plan: user.plan,
  });

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
      },
      token,
    },
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /auth/me — Get current user
// ══════════════════════════════════════════════════════════════════════════════

authRoutes.get('/me', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    throw new ApiError(401, 'Not authenticated');
  }

  const user = await c.env.DB.prepare(`
    SELECT id, email, name, avatar_url, plan, generation_quota, execution_quota, created_at
    FROM users WHERE id = ?
  `).bind(auth.userId).first();

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return c.json({
    success: true,
    data: user,
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /auth/api-keys — Create API key
// ══════════════════════════════════════════════════════════════════════════════

authRoutes.post('/api-keys', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    throw new ApiError(401, 'Authentication required');
  }

  const body = await c.req.json();
  const { name = 'API Key' } = body;

  // Generate key
  const apiKey = await generateApiKey();
  const keyHash = await hashApiKey(apiKey);
  const keyPrefix = apiKey.slice(0, 11); // dk_xxxxxxxx

  // Store key metadata
  const keyId = crypto.randomUUID().slice(0, 24);
  await c.env.DB.prepare(`
    INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix)
    VALUES (?, ?, ?, ?, ?)
  `).bind(keyId, auth.userId, name, keyHash, keyPrefix).run();

  // Also store in SESSIONS KV for fast lookup
  await c.env.SESSIONS.put(`apikey:${keyHash}`, JSON.stringify({
    userId: auth.userId,
    email: auth.email,
    plan: auth.plan,
    createdAt: Date.now(),
  }));

  // Return key ONCE — cannot be retrieved later
  return c.json({
    success: true,
    data: {
      id: keyId,
      name,
      key: apiKey, // Only shown once!
      prefix: keyPrefix,
      createdAt: new Date().toISOString(),
    },
    warning: 'Save this API key! It cannot be retrieved later.',
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  }, 201);
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /auth/api-keys — List user's API keys
// ══════════════════════════════════════════════════════════════════════════════

authRoutes.get('/api-keys', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    throw new ApiError(401, 'Authentication required');
  }

  const keys = await c.env.DB.prepare(`
    SELECT id, name, key_prefix, last_used, is_active, created_at
    FROM api_keys
    WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC
  `).bind(auth.userId).all();

  return c.json({
    success: true,
    data: keys.results,
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /auth/api-keys/:id — Revoke API key
// ══════════════════════════════════════════════════════════════════════════════

authRoutes.delete('/api-keys/:id', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    throw new ApiError(401, 'Authentication required');
  }

  const { id } = c.req.param();

  // Verify ownership and get hash
  const key = await c.env.DB.prepare(
    'SELECT key_hash FROM api_keys WHERE id = ? AND user_id = ?'
  ).bind(id, auth.userId).first<{ key_hash: string }>();

  if (!key) {
    throw new ApiError(404, 'API key not found');
  }

  // Soft delete in DB
  await c.env.DB.prepare(
    'UPDATE api_keys SET is_active = 0 WHERE id = ?'
  ).bind(id).run();

  // Remove from SESSIONS KV
  await c.env.SESSIONS.delete(`apikey:${key.key_hash}`);

  return c.json({
    success: true,
    message: 'API key revoked',
    meta: {
      requestId: c.get('requestId'),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════════

async function hashPassword(password: string): Promise<string> {
  // Use PBKDF2 for password hashing
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, storedHash] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === storedHash;
}

async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
