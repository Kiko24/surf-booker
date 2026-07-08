import { z } from "zod";

export const emailStepSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .transform((v) => v.trim().toLowerCase()),
});

export type EmailStepValues = z.infer<typeof emailStepSchema>;

// ---

export const SUPPORTED_COUNTRIES = [
  { code: "PT", name: "Portugal", dialCode: "+351" },
] as const;

export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number]["code"];

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Pelo menos 1 letra maiúscula")
  .regex(/[0-9]/, "Pelo menos 1 número");

const phonePtSchema = z
  .string()
  .trim()
  .length(9, "Telemóvel deve ter 9 dígitos")
  .regex(/^\d+$/, "Apenas números são permitidos")

export const personalStepSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(80, "Nome demasiado longo")
    .regex(
      /^[\p{L}'\-]+(?:\s+[\p{L}'\-]+)+$/u,
      "Indique nome e apelido (ex: Francisco Ferreira)"
    ),
  password: passwordSchema,
  phone: phonePtSchema,
  country: z.enum(["PT"], { message: "País inválido" }),
  acceptedTerms: z
    .boolean()
    .refine((v) => v === true, "Tem de aceitar os Termos e Políticas"),
});

export type PersonalStepValues = z.infer<typeof personalStepSchema>;

// Validação composta para a action server-side
export const fullSignupSchema = personalStepSchema.extend({
  email: emailStepSchema.shape.email,
});

export type FullSignupValues = z.infer<typeof fullSignupSchema>;

// Helper para checklist de password no UI
export const passwordRules = [
  { id: "len", label: "Mínimo 8 caracteres", test: (v: string) => v.length >= 8 },
  { id: "upper", label: "1 letra maiúscula", test: (v: string) => /[A-Z]/.test(v) },
  { id: "num", label: "1 número", test: (v: string) => /[0-9]/.test(v) },
] as const;