/**
 * Jobora AI — In-Memory Sliding Window Rate Limiter
 * 
 * ARCHITECTURE NOTICE:
 * This rate limiter operates in the local Node.js process memory via globalThis.
 * 
 * Scope & Limitations:
 * - In local development and single-instance deployments, this prevents runaway
 *   client loops, automated scraping, and brute-force abuse.
 * - In distributed serverless environments (e.g., Vercel multi-region Lambdas),
 *   in-memory counters are isolated to each container instance. For globally
 *   consistent rate limits in production, configure an external distributed store
 *   such as Upstash Redis or Cloudflare KV.
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

interface WindowRecord {
  timestamps: number[];
}

declare global {
  var __jobora_rate_limits: Map<string, WindowRecord> | undefined;
}

const rateLimitStore: Map<string, WindowRecord> =
  globalThis.__jobora_rate_limits ||
  (globalThis.__jobora_rate_limits = new Map<string, WindowRecord>());

/**
 * Check and record a rate-limit event for a given key.
 * 
 * @param key Unique identifier (e.g., IP address or userId)
 * @param limit Maximum allowed requests within the window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter out timestamps outside the active sliding window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0] || now;
    const resetAt = oldestTimestamp + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));

    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt,
      retryAfterSeconds,
    };
  }

  // Record this request
  record.timestamps.push(now);
  const remaining = Math.max(0, limit - record.timestamps.length);
  const resetAt = now + windowMs;

  return {
    allowed: true,
    limit,
    remaining,
    resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Helper to extract client IP address from standard request headers.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Build standard rate limit response headers.
 */
export function getRateLimitHeaders(res: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(res.limit),
    'X-RateLimit-Remaining': String(res.remaining),
    'X-RateLimit-Reset': String(Math.ceil(res.resetAt / 1000)),
    'X-RateLimit-Scope': 'local-node-runtime',
  };

  if (!res.allowed) {
    headers['Retry-After'] = String(res.retryAfterSeconds);
  }

  return headers;
}
