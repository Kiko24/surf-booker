import { z } from "zod";
import { uuidSchema, trimmedString, optionalEmailSchema, optionalPhoneSchema } from "./helpers";

export const studentSchema = z
  .object({
    id: uuidSchema.optional(),
    auth_user_id: uuidSchema.nullable().optional(),
    full_name: trimmedString(1, 120),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    is_guest: z.boolean().default(true),
  })
  .refine(
    (data) => data.is_guest === true || data.email != null,
    { message: "Email obrigatório para contas", path: ["email"] }
  )
  .refine(
    (data) => data.auth_user_id == null || data.is_guest === false,
    { message: "Utilizador com conta não pode ser guest", path: ["is_guest"] }
  );

export const studentInsertSchema = studentSchema;

export const studentUpdateSchema = z
  .object({
    full_name: trimmedString(1, 120),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    is_guest: z.boolean(),
  })
  .partial()
  .refine(
    (data) => {
      if (data.is_guest === false && data.email === null) return false;
      return true;
    },
    { message: "Email obrigatório para contas", path: ["email"] }
  );

export const schoolStudentSchema = z.object({
  id: uuidSchema.optional(),
  school_id: uuidSchema,
  student_id: uuidSchema,
  first_seen_at: z.coerce.date().optional(),
});

export const schoolStudentInsertSchema = schoolStudentSchema.omit({
  id: true,
  first_seen_at: true,
});
