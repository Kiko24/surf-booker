import { z } from "zod";
import { uuidSchema, priceCentsSchema } from "./helpers";

export const sessionStatusSchema = z.enum(["scheduled", "cancelled"]);

export const sessionSchema = z
  .object({
    id: uuidSchema.optional(),
    school_id: uuidSchema,
    starts_at: z.coerce.date(),
    duration_minutes: z.number().int().min(15).max(240).default(90),
    capacity: z.number().int().min(0).max(50).nullable().optional(),
    price_cents: priceCentsSchema,
    status: sessionStatusSchema.default("scheduled"),
    cancelled_at: z.coerce.date().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "scheduled") return data.cancelled_at == null;
      if (data.status === "cancelled") return data.cancelled_at != null;
      return true;
    },
    { message: "Estado incoerente com cancelled_at", path: ["status"] }
  );

export const sessionInsertSchema = sessionSchema.omit({
  id: true,
  status: true,
  cancelled_at: true,
});

export const sessionUpdateSchema = z
  .object({
    starts_at: z.coerce.date(),
    duration_minutes: z.number().int().min(15).max(480),
    capacity: z.number().int().min(0).max(100).nullable(),
    price_cents: priceCentsSchema,
    status: sessionStatusSchema,
    cancelled_at: z.coerce.date().nullable(),
  })
  .partial()
  .refine(
    (data) => {
      if (data.status === "scheduled" && data.cancelled_at !== undefined) {
        return data.cancelled_at == null;
      }
      if (data.status === "cancelled" && data.cancelled_at !== undefined) {
        return data.cancelled_at != null;
      }
      return true;
    },
    { message: "Estado incoerente com cancelled_at", path: ["status"] }
  );
