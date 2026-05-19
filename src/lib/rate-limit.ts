import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function createRatelimit() {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, "60 s"),
    analytics: true,
    prefix: "surfbooker",
  });
}

export async function rateLimitByUser(userId: string, action: string) {
  const ratelimit = createRatelimit();
  const { success, remaining, reset } = await ratelimit.limit(`${action}:${userId}`);
  return {
    ok: success,
    remaining,
    resetAt: reset,
  };
}
