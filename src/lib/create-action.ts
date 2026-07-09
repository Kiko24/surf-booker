import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { assertValidOrigin } from "@/lib/csrf";
import { safeError } from "@/lib/safe-error";

// ============================================================
// Types
// ============================================================

export type MutationResult = { ok: true } | { ok: false; error: string };

export type QueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export interface ActionContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  admin: ReturnType<typeof createAdminClient>;
  user: { id: string };
}

// ============================================================
// Error helpers (internal)
// ============================================================

function parseResult<TInput extends z.ZodType>(
  schema: TInput,
  input: unknown,
): { valid: true; data: z.output<TInput> } | { valid: false; error: string } {
  const result = schema.safeParse(input);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return { valid: false, error: firstIssue?.message ?? "Input inválido" };
  }
  return { valid: true, data: result.data };
}

// ============================================================
// defineMutation
// ============================================================

export interface DefineMutationOptions<TInput extends z.ZodType> {
  name: string;
  schema: TInput;
  rateLimit: "default" | "expensive" | false;
  checkAccess?: (input: z.output<TInput>, ctx: ActionContext) => Promise<void>;
  execute: (
    ctx: ActionContext & { input: z.output<TInput> },
  ) => Promise<MutationResult>;
}

export function defineMutation<TInput extends z.ZodType>(
  options: DefineMutationOptions<TInput>,
): (input: z.output<TInput>) => Promise<MutationResult> {
  return async (input: z.output<TInput>): Promise<MutationResult> => {
    try {
      const parsed = parseResult(options.schema, input);
      if (!parsed.valid) return { ok: false, error: parsed.error };

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { ok: false, error: "Não autenticado" };

      try {
        await assertValidOrigin();
      } catch {
        return { ok: false, error: "Origem inválida" };
      }

      if (options.rateLimit !== false) {
        if (options.rateLimit === "expensive") {
          const ratelimit = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(10, "60 s"),
            analytics: true,
            prefix: "surfbooker",
          });
          const rl = await ratelimit.limit(`expensive:${options.name}:${user.id}`);
          if (!rl.success) {
            return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };
          }
        } else {
          const rl = await rateLimitByUser(user.id, options.name);
          if (!rl.ok) {
            return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };
          }
        }
      }

      const admin = createAdminClient();
      const ctx: ActionContext = { supabase, admin, user: { id: user.id } };

      if (options.checkAccess) {
        try {
          await options.checkAccess(parsed.data, ctx);
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "Acesso negado" };
        }
      }

      return await options.execute({ ...ctx, input: parsed.data });
    } catch (err) {
      return { ok: false, error: safeError(err) };
    }
  };
}

// ============================================================
// defineQuery (authenticated reads)
// ============================================================

export interface DefineQueryOptions<TInput extends z.ZodType, TData> {
  name: string;
  schema: TInput;
  checkAccess?: (input: z.output<TInput>, ctx: ActionContext) => Promise<void>;
  execute: (
    ctx: ActionContext & { input: z.output<TInput> },
  ) => Promise<QueryResult<TData>>;
}

export function defineQuery<TInput extends z.ZodType, TData>(
  options: DefineQueryOptions<TInput, TData>,
): (input: z.output<TInput>) => Promise<QueryResult<TData>> {
  return async (input: z.output<TInput>): Promise<QueryResult<TData>> => {
    try {
      const parsed = parseResult(options.schema, input);
      if (!parsed.valid) return { data: null, error: parsed.error };

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: "Não autenticado" };

      const admin = createAdminClient();
      const ctx: ActionContext = { supabase, admin, user: { id: user.id } };

      if (options.checkAccess) {
        try {
          await options.checkAccess(parsed.data, ctx);
        } catch (err) {
          return { data: null, error: err instanceof Error ? err.message : "Acesso negado" };
        }
      }

      return await options.execute({ ...ctx, input: parsed.data });
    } catch (err) {
      return { data: null, error: safeError(err) };
    }
  };
}

// ============================================================
// definePublicAction (no auth, optional rate limit)
// ============================================================

export interface DefinePublicActionOptions<TInput extends z.ZodType> {
  name: string;
  schema: TInput;
  rateLimit?: { maxRequests: number; window: string } | false;
  execute: (
    ctx: { input: z.output<TInput>; supabase: Awaited<ReturnType<typeof createClient>> },
  ) => Promise<MutationResult>;
}

export function definePublicAction<TInput extends z.ZodType>(
  options: DefinePublicActionOptions<TInput>,
): (input: z.output<TInput>) => Promise<MutationResult> {
  return async (input: z.output<TInput>): Promise<MutationResult> => {
    try {
      const parsed = parseResult(options.schema, input);
      if (!parsed.valid) return { ok: false, error: parsed.error };

      if (options.rateLimit !== false) {
        const { rateLimitPublic } = await import("@/lib/rate-limit");
        const maxRequests = options.rateLimit?.maxRequests ?? 10;
        const window = options.rateLimit?.window ?? "60 s";
        const rl = await rateLimitPublic(options.name, maxRequests, window as any);
        if (!rl.ok) {
          return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };
        }
      }

      const supabase = await createClient();
      return await options.execute({ input: parsed.data, supabase });
    } catch (err) {
      return { ok: false, error: safeError(err) };
    }
  };
}

// ============================================================
// requireServerContext — helper for incremental migration
// ============================================================

/**
 * For migrating existing actions that can't use defineMutation yet.
 * Replaces the 6-line auth + CSRF boilerplate with a single call.
 *
 * Usage:
 *   const ctx = await requireServerContext();
 *   // supabase, admin, user available
 */
export async function requireServerContext(): Promise<ActionContext> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  await assertValidOrigin();

  const admin = createAdminClient();
  return { supabase, admin, user: { id: user.id } };
}
