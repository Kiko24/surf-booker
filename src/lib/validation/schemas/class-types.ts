import { z } from "zod";
import { uuidSchema, trimmedString, priceCentsSchema } from "./helpers";

export const classTypeSchema = z.object({
  id: uuidSchema.optional(),
  school_id: uuidSchema,
  name: trimmedString(1, 80),
  default_duration_minutes: z.number().int().min(15).max(240).default(90),
  price_cents: priceCentsSchema,
  is_active: z.boolean().default(true),
});

export const classTypeInsertSchema = classTypeSchema.omit({ id: true });

export const classTypeUpdateSchema = z
  .object({
    name: trimmedString(1, 80),
    default_duration_minutes: z.number().int().min(15).max(240),
    price_cents: priceCentsSchema,
    is_active: z.boolean(),
  })
  .partial();
