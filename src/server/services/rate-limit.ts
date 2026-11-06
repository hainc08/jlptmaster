// In-memory sliding-window limiter for auth endpoints.
// Works per Node.js process (enough for a single Hostinger Node app). For multiple instances, move to a shared store.

interface Bucket {
  failures: number[]; // timestamps (ms)
}

const buckets = new Map<string, Bucket>();

export interface LimitRule {
  max: number;
  windowMs: number;
}

export const LOGIN_EMAIL_RULE: LimitRule = { max: 5, windowMs: 15 * 60 * 1000 };
export const LOGIN_IP_RULE: LimitRule = { max: 30, windowMs: 15 * 60 * 1000 };
export const REGISTER_IP_RULE: LimitRule = { max: 10, windowMs: 15 * 60 * 1000 };

function prune(bucket: Bucket, windowMs: number, now: number) {
  bucket.failures = bucket.failures.filter((t) => now - t < windowMs);
}

/** Returns seconds to wait if the key is blocked, otherwise 0. */
export function checkLimit(key: string, rule: LimitRule, now = Date.now()): number {
  const bucket = buckets.get(key);
  if (!bucket) return 0;
  prune(bucket, rule.windowMs, now);
  if (bucket.failures.length === 0) {
    buckets.delete(key);
    return 0;
  }
  if (bucket.failures.length >= rule.max) {
    const oldest = bucket.failures[0];
    return Math.max(1, Math.ceil((oldest + rule.windowMs - now) / 1000));
  }
  return 0;
}

export function recordFailure(key: string, rule: LimitRule, now = Date.now()) {
  const bucket = buckets.get(key) ?? { failures: [] };
  prune(bucket, rule.windowMs, now);
  bucket.failures.push(now);
  buckets.set(key, bucket);
  // Keep memory bounded
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) {
      if (b.failures.length === 0 || now - b.failures[b.failures.length - 1] > 60 * 60 * 1000) buckets.delete(k);
    }
  }
}

export function clearLimit(key: string) {
  buckets.delete(key);
}

export function resetAuthRateLimits() {
  buckets.clear();
}

export function clientIp(req: { headers: { get(name: string): string | null } }): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
