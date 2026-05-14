import { z } from 'zod';

// ============================================================
// Helpers
// ============================================================

const trimmedString = (min: number, max: number) =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(min).max(max));

const optionalTrimmedString = (min: number, max: number) =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(min).max(max))
    .nullable()
    .optional();

const emailSchema = z
  .string()
  .transform((s) => s.trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(5)
      .max(160)
      .regex(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Email inválido'
      )
  );

const optionalEmailSchema = z
  .string()
  .transform((s) => s.trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(5)
      .max(160)
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido')
  )
  .nullable()
  .optional();

const phoneSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(
    z
      .string()
      .min(6)
      .max(20)
      .regex(/^[0-9+() /.\-]+$/, 'Telefone inválido')
  );

const optionalPhoneSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(
    z
      .string()
      .min(6)
      .max(20)
      .regex(/^[0-9+() /.\-]+$/, 'Telefone inválido')
  )
  .nullable()
  .optional();

const slugSchema = z
  .string()
  .min(3)
  .max(60)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug inválido (apenas letras minúsculas, números e hífens)'
  );

const uuidSchema = z.string().uuid();

const priceCentsSchema = z.number().int().min(0).max(500000);

// ============================================================
// SCHOOLS
// ============================================================

export const schoolSchema = z.object({
  id: uuidSchema.optional(),
  owner_user_id: uuidSchema,
  name: trimmedString(2, 100),
  slug: slugSchema,
  description: optionalTrimmedString(1, 1000),
  location: optionalTrimmedString(1, 100),
  timezone: trimmedString(3, 50).default('Europe/Lisbon'),
  cancellation_window_hours: z.number().int().min(0).max(720).default(24),
});

export const schoolInsertSchema = schoolSchema.omit({ id: true });

export const schoolUpdateSchema = schoolSchema
  .omit({ id: true, owner_user_id: true })
  .partial();

// ============================================================
// STUDENTS
// ============================================================

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
    { message: 'Email obrigatório para contas', path: ['email'] }
  )
  .refine(
    (data) => data.auth_user_id == null || data.is_guest === false,
    { message: 'Utilizador com conta não pode ser guest', path: ['is_guest'] }
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
    { message: 'Email obrigatório para contas', path: ['email'] }
  );

// ============================================================
// SCHOOL_STUDENTS
// ============================================================

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

// ============================================================
// SESSIONS
// ============================================================

export const sessionStatusSchema = z.enum(['scheduled', 'cancelled']);

export const sessionSchema = z
  .object({
    id: uuidSchema.optional(),
    school_id: uuidSchema,
    starts_at: z.coerce.date(),
    duration_minutes: z.number().int().min(15).max(240).default(90),
    capacity: z.number().int().min(1).max(50).nullable().optional(),
    price_cents: priceCentsSchema,
    status: sessionStatusSchema.default('scheduled'),
    cancelled_at: z.coerce.date().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'scheduled') return data.cancelled_at == null;
      if (data.status === 'cancelled') return data.cancelled_at != null;
      return true;
    },
    { message: 'Estado incoerente com cancelled_at', path: ['status'] }
  );

export const sessionInsertSchema = sessionSchema.omit({
  id: true,
  status: true,
  cancelled_at: true,
});

export const sessionUpdateSchema = z
  .object({
    starts_at: z.coerce.date(),
    duration_minutes: z.number().int().min(15).max(480),
    capacity: z.number().int().min(1).max(100).nullable(),
    price_cents: priceCentsSchema,
    status: sessionStatusSchema,
    cancelled_at: z.coerce.date().nullable(),
  })
  .partial()
  .refine(
    (data) => {
      if (data.status === 'scheduled' && data.cancelled_at !== undefined) {
        return data.cancelled_at == null;
      }
      if (data.status === 'cancelled' && data.cancelled_at !== undefined) {
        return data.cancelled_at != null;
      }
      return true;
    },
    { message: 'Estado incoerente com cancelled_at', path: ['status'] }
  );

// ============================================================
// BOOKING_GROUPS
// ============================================================

export const bookingGroupSourceSchema = z.enum(['guest', 'account']);
export const bookingGroupStatusSchema = z.enum(['active', 'cancelled']);

export const bookingGroupSchema = z
  .object({
    id: uuidSchema.optional(),
    school_id: uuidSchema,
    session_id: uuidSchema,
    booked_by_student_id: uuidSchema,
    contact_name: trimmedString(1, 120),
    contact_email: emailSchema,
    contact_phone: phoneSchema,
    source: bookingGroupSourceSchema.default('guest'),
    status: bookingGroupStatusSchema.default('active'),
    cancelled_at: z.coerce.date().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'active') return data.cancelled_at == null;
      if (data.status === 'cancelled') return data.cancelled_at != null;
      return true;
    },
    { message: 'Estado incoerente com cancelled_at', path: ['status'] }
  );

export const bookingGroupInsertSchema = bookingGroupSchema.omit({
  id: true,
  status: true,
  cancelled_at: true,
});

export const bookingGroupUpdateSchema = z
  .object({
    contact_name: trimmedString(1, 120),
    contact_email: emailSchema,
    contact_phone: phoneSchema,
    status: bookingGroupStatusSchema,
    cancelled_at: z.coerce.date().nullable(),
  })
  .partial()
  .refine(
    (data) => {
      if (data.status === 'active' && data.cancelled_at !== undefined) {
        return data.cancelled_at == null;
      }
      if (data.status === 'cancelled' && data.cancelled_at !== undefined) {
        return data.cancelled_at != null;
      }
      return true;
    },
    { message: 'Estado incoerente com cancelled_at', path: ['status'] }
  );

// ============================================================
// BOOKINGS
// ============================================================

export const bookingStatusSchema = z.enum([
  'confirmed',
  'cancelled_by_student',
  'cancelled_by_school',
  'attended',
  'no_show',
]);

export const paymentMethodSchema = z.enum(['single', 'pack']);
export const paymentStatusSchema = z.enum(['unpaid', 'paid_offline']);

export const bookingSchema = z
  .object({
    id: uuidSchema.optional(),
    booking_group_id: uuidSchema,
    session_id: uuidSchema,
    student_id: uuidSchema,
    status: bookingStatusSchema.default('confirmed'),
    payment_method: paymentMethodSchema.default('single'),
    payment_status: paymentStatusSchema.default('unpaid'),
    pack_purchase_id: uuidSchema.nullable().optional(),
    price_cents: priceCentsSchema,
    cancelled_at: z.coerce.date().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.payment_method === 'single') return data.pack_purchase_id == null;
      if (data.payment_method === 'pack') return data.pack_purchase_id != null;
      return true;
    },
    { message: 'pack_purchase_id incoerente com payment_method', path: ['pack_purchase_id'] }
  )
  .refine(
    (data) => {
      const cancelledStatuses = ['cancelled_by_student', 'cancelled_by_school'];
      if (cancelledStatuses.includes(data.status)) return data.cancelled_at != null;
      return data.cancelled_at == null;
    },
    { message: 'Estado incoerente com cancelled_at', path: ['status'] }
  );

export const bookingInsertSchema = bookingSchema.omit({
  id: true,
  status: true,
  cancelled_at: true,
});

export const bookingUpdateSchema = z
  .object({
    status: bookingStatusSchema,
    payment_status: paymentStatusSchema,
    cancelled_at: z.coerce.date().nullable(),
  })
  .partial()
  .refine(
    (data) => {
      const cancelledStatuses = ['cancelled_by_student', 'cancelled_by_school'];
      if (data.status && cancelledStatuses.includes(data.status)) {
        return data.cancelled_at !== undefined ? data.cancelled_at != null : true;
      }
      if (data.status && !cancelledStatuses.includes(data.status)) {
        return data.cancelled_at !== undefined ? data.cancelled_at == null : true;
      }
      return true;
    },
    { message: 'Estado incoerente com cancelled_at', path: ['status'] }
  );

// ============================================================
// PACKS
// ============================================================

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

// ============================================================
// PACK_PURCHASES
// ============================================================

export const packPurchaseStatusSchema = z.enum(['active', 'exhausted', 'cancelled']);

export const packPurchaseSchema = z.object({
  id: uuidSchema.optional(),
  school_id: uuidSchema,
  pack_id: uuidSchema,
  student_id: uuidSchema,
  lessons_remaining: z.number().int().min(0).max(100),
  status: packPurchaseStatusSchema.default('active'),
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

// ============================================================
// WAIVER_VERSIONS
// ============================================================

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

// ============================================================
// WAIVER_ACCEPTANCES
// ============================================================

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

// ============================================================
// PROFILES
// ============================================================

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

// Schema usado no signup do form (sem timestamps gerados pelo server)
export const profileSignupSchema = z.object({
  full_name: trimmedString(1, 120),
  phone: phoneSchema,
  accepted_terms: z.literal(true, {
  message: 'Tens de aceitar os termos',
}),
accepted_privacy: z.literal(true, {
  message: 'Tens de aceitar a política de privacidade',
}),
});

// ============================================================
// CLASS_TYPES
// ============================================================

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