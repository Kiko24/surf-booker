// ============================================================
// Schemas
// ============================================================
export {
  // Schools
  schoolSchema,
  schoolInsertSchema,
  schoolUpdateSchema,
  
  // Students
  studentSchema,
  studentInsertSchema,
  studentUpdateSchema,
  
  // School Students
  schoolStudentSchema,
  schoolStudentInsertSchema,
  
  // Sessions
  sessionSchema,
  sessionInsertSchema,
  sessionUpdateSchema,
  sessionStatusSchema,
  
  // Booking Groups
  bookingGroupSchema,
  bookingGroupInsertSchema,
  bookingGroupUpdateSchema,
  bookingGroupSourceSchema,
  bookingGroupStatusSchema,
  
  // Bookings
  bookingSchema,
  bookingInsertSchema,
  bookingUpdateSchema,
  bookingStatusSchema,
  paymentMethodSchema,
  paymentStatusSchema,
  
  // Packs
  packSchema,
  packInsertSchema,
  packUpdateSchema,
  
  // Pack Purchases
  packPurchaseSchema,
  packPurchaseInsertSchema,
  packPurchaseUpdateSchema,
  packPurchaseStatusSchema,
  
  // Waiver Versions
  waiverVersionSchema,
  waiverVersionInsertSchema,
  waiverVersionUpdateSchema,
  
  // Waiver Acceptances
  waiverAcceptanceSchema,
  waiverAcceptanceInsertSchema,

    // Profiles
  profileSchema,
  profileInsertSchema,
  profileUpdateSchema,
  profileSignupSchema,

  // Class Types
  classTypeSchema,
  classTypeInsertSchema,
  classTypeUpdateSchema,
} from './schemas';

// ============================================================
// Types
// ============================================================
import { z } from 'zod';
import {
  schoolSchema,
  schoolInsertSchema,
  schoolUpdateSchema,
  studentSchema,
  studentInsertSchema,
  studentUpdateSchema,
  schoolStudentSchema,
  schoolStudentInsertSchema,
  sessionSchema,
  sessionInsertSchema,
  sessionUpdateSchema,
  bookingGroupSchema,
  bookingGroupInsertSchema,
  bookingGroupUpdateSchema,
  bookingSchema,
  bookingInsertSchema,
  bookingUpdateSchema,
  packSchema,
  packInsertSchema,
  packUpdateSchema,
  packPurchaseSchema,
  packPurchaseInsertSchema,
  packPurchaseUpdateSchema,
  waiverVersionSchema,
  waiverVersionInsertSchema,
  waiverVersionUpdateSchema,
  waiverAcceptanceSchema,
  waiverAcceptanceInsertSchema,
    profileSchema,
  profileInsertSchema,
  profileUpdateSchema,
  profileSignupSchema,
  classTypeSchema,
  classTypeInsertSchema,
  classTypeUpdateSchema,
} from './schemas';

// Schools
export type School = z.infer<typeof schoolSchema>;
export type SchoolInsert = z.infer<typeof schoolInsertSchema>;
export type SchoolUpdate = z.infer<typeof schoolUpdateSchema>;

// Students
export type Student = z.infer<typeof studentSchema>;
export type StudentInsert = z.infer<typeof studentInsertSchema>;
export type StudentUpdate = z.infer<typeof studentUpdateSchema>;

// School Students
export type SchoolStudent = z.infer<typeof schoolStudentSchema>;
export type SchoolStudentInsert = z.infer<typeof schoolStudentInsertSchema>;

// Sessions
export type Session = z.infer<typeof sessionSchema>;
export type SessionInsert = z.infer<typeof sessionInsertSchema>;
export type SessionUpdate = z.infer<typeof sessionUpdateSchema>;

// Booking Groups
export type BookingGroup = z.infer<typeof bookingGroupSchema>;
export type BookingGroupInsert = z.infer<typeof bookingGroupInsertSchema>;
export type BookingGroupUpdate = z.infer<typeof bookingGroupUpdateSchema>;

// Bookings
export type Booking = z.infer<typeof bookingSchema>;
export type BookingInsert = z.infer<typeof bookingInsertSchema>;
export type BookingUpdate = z.infer<typeof bookingUpdateSchema>;

// Packs
export type Pack = z.infer<typeof packSchema>;
export type PackInsert = z.infer<typeof packInsertSchema>;
export type PackUpdate = z.infer<typeof packUpdateSchema>;

// Pack Purchases
export type PackPurchase = z.infer<typeof packPurchaseSchema>;
export type PackPurchaseInsert = z.infer<typeof packPurchaseInsertSchema>;
export type PackPurchaseUpdate = z.infer<typeof packPurchaseUpdateSchema>;

// Waiver Versions
export type WaiverVersion = z.infer<typeof waiverVersionSchema>;
export type WaiverVersionInsert = z.infer<typeof waiverVersionInsertSchema>;
export type WaiverVersionUpdate = z.infer<typeof waiverVersionUpdateSchema>;

// Waiver Acceptances
export type WaiverAcceptance = z.infer<typeof waiverAcceptanceSchema>;
export type WaiverAcceptanceInsert = z.infer<typeof waiverAcceptanceInsertSchema>;

// Profiles
export type Profile = z.infer<typeof profileSchema>;
export type ProfileInsert = z.infer<typeof profileInsertSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type ProfileSignup = z.infer<typeof profileSignupSchema>;

// Class Types
export type ClassType = z.infer<typeof classTypeSchema>;
export type ClassTypeInsert = z.infer<typeof classTypeInsertSchema>;
export type ClassTypeUpdate = z.infer<typeof classTypeUpdateSchema>;