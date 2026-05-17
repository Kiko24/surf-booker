import { z } from "zod";
import { FREGUESIAS_PT, formatFreguesia } from "@/lib/data/freguesias-pt";

const VALID_LOCATIONS = new Set(FREGUESIAS_PT.map(formatFreguesia));

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
    .max(100, "Localização demasiado longa")
    .refine((v) => VALID_LOCATIONS.has(v), "Freguesia inválida"),
  description: z
    .string()
    .trim()
    .max(1000, "Descrição demasiado longa")
    .optional()
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;