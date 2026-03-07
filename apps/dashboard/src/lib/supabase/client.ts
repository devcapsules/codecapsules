import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase browser client.
 * 
 * Routes all requests through the Cloudflare Workers proxy to bypass
 * ISP-level DNS blocks (e.g. India's supabase.co block).
 * 
 * Browser → Workers (/supabase/*) → Supabase
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const proxyUrl = process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL

  return createBrowserClient(
    proxyUrl || supabaseUrl,
    supabaseAnonKey
  )
}