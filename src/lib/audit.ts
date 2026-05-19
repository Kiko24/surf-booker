import { createAdminClient } from "@/lib/supabase/admin";

type AuditEvent = {
  schoolId: string | null;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: Record<string, unknown>;
};

export async function logAudit(event: AuditEvent) {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      school_id: event.schoolId,
      user_id: event.userId,
      action: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId,
      metadata: event.metadata ?? {},
    });
  } catch {
    // audit nunca bloqueia a operação principal
  }
}
