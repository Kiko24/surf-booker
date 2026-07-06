import { z } from "zod";
import { uuidSchema, trimmedString, phoneSchema } from "./helpers";

export const profileSchema = z.object({
  user_id: uuidSchema,
  full_name: trimmedString(1, 120),
  phone: phoneSchema,
  accepted_terms_at: z.coerce.date(),
  accepted_privacy_at: z.coerce.date(),
});

export const profileInsertSchema = profileSchema;

export const profileUpdateSchema = z
  .object({
    full_name: trimmedString(1, 120),
    phone: phoneSchema,
  })
  .partial();

export const profileSignupSchema = z.object({
  full_name: trimmedString(1, 120),
  phone: phoneSchema,
  accepted_terms: z.literal(true, { message: "Tens de aceitar os termos" }),
  accepted_privacy: z.literal(true, { message: "Tens de aceitar a política de privacidade" }),
});
