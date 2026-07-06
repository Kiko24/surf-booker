import { z } from "zod";
import { uuidSchema, trimmedString } from "./helpers";

export const waiverVersionSchema = z.object({
  id: uuidSchema.optional(),
  school_id: uuidSchema,
  version: z.number().int().min(1).max(1000),
  title: trimmedString(1, 150),
  body: z.string().min(1).max(20000),
  is_active: z.boolean().default(true),
});

export const waiverVersionInsertSchema = waiverVersionSchema.omit({ id: true });

export const waiverVersionUpdateSchema = z
  .object({
    title: trimmedString(1, 150),
    body: z.string().min(1).max(20000),
    is_active: z.boolean(),
  })
  .partial();

export const waiverAcceptanceSchema = z.object({
  id: uuidSchema.optional(),
  school_id: uuidSchema,
  student_id: uuidSchema,
  waiver_version_id: uuidSchema,
  accepted_at: z.coerce.date().optional(),
  ip: z.string().max(45).nullable().optional(),
  user_agent: z.string().max(400).nullable().optional(),
});

export const waiverAcceptanceInsertSchema = waiverAcceptanceSchema.omit({
  id: true,
  accepted_at: true,
});
