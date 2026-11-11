import "server-only";

// Small fixed-window rate limiter kept in memory. Good enough for a single
// server process; behind several instances or serverless functions each one
// keeps its own counts, so use a shared store (e.g. Redis) there.

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  if (limit <= 0) return { allowed: true, retryAfterSeconds: 0 };

  // Drop expired windows now and then so the map can't grow without bound.
  if (windows.size > 10_000) {
    windows.forEach((w, k) => {
      if (w.resetAt <= now) windows.delete(k);
    });
  }

  let window = windows.get(key);
  if (!window || window.resetAt <= now) {
    window = { count: 0, resetAt: now + windowMs };
    windows.set(key, window);
  }

  if (window.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((window.resetAt - now) / 1000),
    };
  }
  window.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
