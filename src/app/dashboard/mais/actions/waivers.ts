"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { safeError } from "@/lib/safe-error";
import { requireOwner } from "@/lib/school";

export type WaiverVersion = {
  id: string;
  version: number;
  title: string;
  body: string;
  is_active: boolean;
  created_at: string;
  acceptance_count: number;
};

export async function getWaiverVersions(schoolId: string): Promise<WaiverVersion[]> {
  const { supabase } = await requireOwner(schoolId);

  const { data } = await supabase
    .from("waiver_versions")
    .select("id, version, title, body, is_active, created_at")
    .eq("school_id", schoolId)
    .order("version", { ascending: false });

  if (!data) return [];

  const versionIds = data.map(v => v.id);
  const { data: acceptances } = await supabase
    .from("waiver_acceptances")
    .select("waiver_version_id")
    .in("waiver_version_id", versionIds);

  const counts = new Map<string, number>();
  for (const a of acceptances ?? []) {
    counts.set(a.waiver_version_id, (counts.get(a.waiver_version_id) ?? 0) + 1);
  }

  return data.map(v => ({ ...v, acceptance_count: counts.get(v.id) ?? 0 }));
}

export type WaiverAcceptanceRow = {
  id: string;
  student_name: string;
  accepted_at: string;
};

export async function getWaiverAcceptances(schoolId: string, waiverVersionId: string): Promise<WaiverAcceptanceRow[]> {
  const { supabase } = await requireOwner(schoolId);

  const { data } = await supabase
    .from("waiver_acceptances")
    .select("id, school_id, student_id, accepted_at")
    .eq("school_id", schoolId)
    .eq("waiver_version_id", waiverVersionId)
    .order("accepted_at", { ascending: false });

  if (!data) return [];

  const studentIds = data.map(a => a.student_id);
  const admin = createAdminClient();
  const { data: students } = await admin
    .from("students")
    .select("id, full_name")
    .in("id", studentIds);

  const studentMap = new Map(students?.map(s => [s.id, s.full_name]) ?? []);

  return data.map(a => ({
    id: a.id,
    student_name: studentMap.get(a.student_id) ?? "Desconhecido",
    accepted_at: a.accepted_at,
  }));
}

export async function saveWaiverVersion(
  schoolId: string,
  data: { title: string; body: string }
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireOwner(schoolId);

  const rl = await rateLimitByUser(user.id, "saveWaiverVersion");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const trimmedTitle = data.title.trim();
  const trimmedBody = data.body.trim();
  if (!trimmedTitle || trimmedTitle.length > 150) return { ok: false, error: "Título deve ter entre 1 e 150 caracteres" };
  if (!trimmedBody || trimmedBody.length > 20000) return { ok: false, error: "Texto deve ter entre 1 e 20000 caracteres" };

  const { data: maxVer } = await supabase
    .from("waiver_versions")
    .select("version")
    .eq("school_id", schoolId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (maxVer?.version ?? 0) + 1;

  await supabase
    .from("waiver_versions")
    .update({ is_active: false })
    .eq("school_id", schoolId)
    .eq("is_active", true);

  const { error } = await supabase
    .from("waiver_versions")
    .insert({
      school_id: schoolId,
      version: nextVersion,
      title: trimmedTitle,
      body: trimmedBody,
      is_active: true,
    });

  if (error) return { ok: false, error: safeError(error) };

  logAudit({
    schoolId,
    userId: user.id,
    action: "create_waiver_version",
    entityType: "waiver_versions",
    entityId: null,
    metadata: { version: nextVersion, title: trimmedTitle },
  });

  return { ok: true };
}
