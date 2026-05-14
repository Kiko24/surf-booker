import { z } from "zod";

export const onboardingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome demasiado curto")
    .max(100, "Nome demasiado longo"),
  location: z
    .string()
    .trim()
    .min(1, "Selecciona uma localização")
    .max(100, "Localização demasiado longa"),
  description: z
    .string()
    .trim()
    .max(1000, "Descrição demasiado longa")
    .optional()
    .or(z.literal("")),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;