import Stripe from "stripe";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

function assertEnvVars() {
  const requiredVars = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] as const;
  for (const v of requiredVars) {
    if (!process.env[v]) {
      throw new Error(`Falta variável de ambiente: ${v}`);
    }
  }
}

function createStripeClient() {
  assertEnvVars();
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
  });
}

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) _stripe = createStripeClient();
  return _stripe;
}

let _redis: ReturnType<typeof Redis.fromEnv> | null = null;

function getRedis() {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

export async function markEventProcessed(sessionId: string): Promise<boolean> {
  const key = `stripe:session:${sessionId}`;
  const redis = getRedis();
  const already = await redis.get(key);
  if (already) return false;
  await redis.set(key, true, { ex: 86400 });
  return true;
}

export function validateUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function getStripeEnv() {
  assertEnvVars();
  return {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  };
}

export function logStripeEvent(eventType: string, sessionId: string, metadata: Record<string, string | undefined>) {
  logger.info("stripe-webhook", `Evento ${eventType} recebido`, {
    sessionId,
    ...metadata,
  });
}
