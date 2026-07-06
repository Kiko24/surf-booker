import { z } from "zod";
import { uuidSchema, trimmedString, emailSchema, phoneSchema, priceCentsSchema, cancelledAtRefinement } from "./helpers";

export const bookingGroupSourceSchema = z.enum(["guest", "account"]);
export const bookingGroupStatusSchema = z.enum(["active", "cancelled"]);

export const bookingGroupSchema = z
  .object({
    id: uuidSchema.optional(),
    school_id: uuidSchema,
    session_id: uuidSchema,
    booked_by_student_id: uuidSchema,
    contact_name: trimmedString(1, 120),
    contact_email: emailSchema,
    contact_phone: phoneSchema,
    source: bookingGroupSourceSchema.default("guest"),
    status: bookingGroupStatusSchema.default("active"),
    cancelled_at: z.coerce.date().nullable().optional(),
  })
  .superRefine(cancelledAtRefinement(["cancelled"]));

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
  .superRefine(cancelledAtRefinement(["cancelled"]));

export const bookingStatusSchema = z.enum([
  "confirmed",
  "cancelled_by_student",
  "cancelled_by_school",
  "attended",
  "no_show",
]);

export const paymentMethodSchema = z.enum(["single", "pack"]);
export const paymentStatusSchema = z.enum(["unpaid", "paid_offline"]);

export const bookingSchema = z
  .object({
    id: uuidSchema.optional(),
    booking_group_id: uuidSchema,
    session_id: uuidSchema,
    student_id: uuidSchema,
    status: bookingStatusSchema.default("confirmed"),
    payment_method: paymentMethodSchema.default("single"),
    payment_status: paymentStatusSchema.default("unpaid"),
    pack_purchase_id: uuidSchema.nullable().optional(),
    price_cents: priceCentsSchema,
    cancelled_at: z.coerce.date().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.payment_method === "single") return data.pack_purchase_id == null;
      if (data.payment_method === "pack") return data.pack_purchase_id != null;
      return true;
    },
    { message: "pack_purchase_id incoerente com payment_method", path: ["pack_purchase_id"] }
  )
  .superRefine(cancelledAtRefinement(["cancelled_by_student", "cancelled_by_school"]));

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
  .superRefine(cancelledAtRefinement(["cancelled_by_student", "cancelled_by_school"]));
