import { z } from "zod";
import { uuidSchema, trimmedString, priceCentsSchema } from "./helpers";

export const packSchema = z.object({
  id: uuidSchema.optional(),
  school_id: uuidSchema,
  name: trimmedString(1, 80),
  total_lessons: z.number().int().min(1).max(100),
  price_cents: priceCentsSchema,
  is_active: z.boolean().default(true),
});

export const packInsertSchema = packSchema.omit({ id: true });

export const packUpdateSchema = z
  .object({
    name: trimmedString(1, 80),
    total_lessons: z.number().int().min(1).max(100),
    price_cents: priceCentsSchema,
    is_active: z.boolean(),
  })
  .partial();

export const packPurchaseStatusSchema = z.enum(["active", "exhausted", "cancelled"]);

export const packPurchaseSchema = z.object({
  id: uuidSchema.optional(),
  school_id: uuidSchema,
  pack_id: uuidSchema,
  student_id: uuidSchema,
  lessons_remaining: z.number().int().min(0).max(100),
  status: packPurchaseStatusSchema.default("active"),
  purchased_at: z.coerce.date().optional(),
});

export const packPurchaseInsertSchema = packPurchaseSchema.omit({
  id: true,
  status: true,
  purchased_at: true,
});

export const packPurchaseUpdateSchema = z
  .object({
    lessons_remaining: z.number().int().min(0).max(100),
    status: packPurchaseStatusSchema,
  })
  .partial();
