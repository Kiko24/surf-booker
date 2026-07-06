import { z } from "zod";
import { uuidSchema, trimmedString, optionalTrimmedString, slugSchema } from "./helpers";

export const schoolSchema = z.object({
  id: uuidSchema.optional(),
  owner_user_id: uuidSchema,
  name: trimmedString(2, 100),
  slug: slugSchema,
  description: optionalTrimmedString(1, 1000),
  location: optionalTrimmedString(1, 100),
  timezone: trimmedString(3, 50).default("Europe/Lisbon"),
  cancellation_window_hours: z.number().int().min(0).max(720).default(24),
});

export const schoolInsertSchema = schoolSchema.omit({ id: true });

export const schoolUpdateSchema = schoolSchema
  .omit({ id: true, owner_user_id: true })
  .partial();
