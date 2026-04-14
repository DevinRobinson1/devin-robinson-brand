import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;

export function getRateLimiter(): Ratelimit {
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'portal',
    });
  }
  return ratelimit;
}

export async function limit(key: string) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return { success: true };
  return getRateLimiter().limit(key);
}
