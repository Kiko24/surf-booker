import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido"),
  password: z.string().min(1, "Insere a tua password"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Precisa de 1 letra maiúscula")
      .regex(/[0-9]/, "Precisa de 1 número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As passwords não coincidem",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;