import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

function createRatelimit() {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, "60 s"),
    analytics: true,
    prefix: "surfbooker",
  });
}

function createRatelimitStrict(maxRequests: number, window: Duration) {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(maxRequests, window),
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

async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    const xff = headersList.get("x-forwarded-for");
    if (xff) {
      const ips = xff.split(",").map((s) => s.trim()).filter(Boolean);
      return ips[ips.length - 1] ?? "unknown";
    }
    return headersList.get("x-real-ip") ?? "unknown";
  } catch {
    return "unknown";
  }
}

export async function rateLimitPublic(action: string, maxRequests = 10, window: Duration = "60 s") {
  const ip = await getClientIp();
  const ratelimit = createRatelimitStrict(maxRequests, window);
  const { success, remaining, reset } = await ratelimit.limit(`public:${action}:${ip}`);
  return {
    ok: success,
    remaining,
    resetAt: reset,
  };
}
