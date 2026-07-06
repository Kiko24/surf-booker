import { z } from "zod";

export const trimmedString = (min: number, max: number) =>
  z.string().transform((s) => s.trim()).pipe(z.string().min(min).max(max));

export const optionalTrimmedString = (min: number, max: number) =>
  z.string().transform((s) => s.trim()).pipe(z.string().min(min).max(max)).nullable().optional();

export const emailSchema = z
  .string()
  .transform((s) => s.trim().toLowerCase())
  .pipe(z.string().min(5).max(160).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido"));

export const optionalEmailSchema = z
  .string()
  .transform((s) => s.trim().toLowerCase())
  .pipe(z.string().min(5).max(160).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido"))
  .nullable()
  .optional();

export const phoneSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(6).max(20).regex(/^[0-9+() /.\-]+$/, "Telefone inválido"));

export const optionalPhoneSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(6).max(20).regex(/^[0-9+() /.\-]+$/, "Telefone inválido"))
  .nullable()
  .optional();

export const slugSchema = z
  .string()
  .min(3)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido (apenas letras minúsculas, números e hífens)");

export const uuidSchema = z.string().uuid();

export const priceCentsSchema = z.number().int().min(0).max(500000);

type HasCancelledAt<T> = T & { cancelled_at?: Date | string | null; status?: string };

export function cancelledAtRefinement<T>(
  cancelledStatuses: string[],
): (data: HasCancelledAt<T>, ctx: z.RefinementCtx) => void {
  return (data, ctx) => {
    if (data.status === undefined) return;
    const needsCancelledAt = cancelledStatuses.includes(data.status);
    if (data.cancelled_at === undefined) {
      if (needsCancelledAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Estado incoerente com cancelled_at",
          path: ["cancelled_at"],
        });
      }
      return;
    }
    if (needsCancelledAt && data.cancelled_at == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Estado incoerente com cancelled_at",
        path: ["cancelled_at"],
      });
    }
    if (!needsCancelledAt && data.cancelled_at != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Estado incoerente com cancelled_at",
        path: ["cancelled_at"],
      });
    }
  };
}
