"use server";

import { createClient } from "@/lib/supabase/server";
import { rateLimitByUser } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { getSchoolId } from "@/lib/school";
import { z } from "zod";

const packSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1, "Nome do pack é obrigatório").max(80),
  numeroAulas: z.number().int().min(1, "Mínimo 1 aula").max(100, "Máximo 100 aulas"),
  preco: z.number().int().min(0).max(500000),
});

const servicoBaseSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(80),
  modalidade: z.string().min(1, "Modalidade é obrigatória").max(50),
  duracao: z.number().int().min(15, "Mínimo 15 minutos").max(240, "Máximo 240 minutos"),
  sobre: z.string().max(1000).optional(),
  avulsoDisponivel: z.boolean(),
  avulsoPreco: z.number().int().min(0).max(500000),
  categoria: z.enum(["aula", "pack", "aluguer"]).optional(),
  packs: z.array(packSchema).max(20),
  totalLessons: z.number().int().min(1).max(100).optional(),
});

export type PackOption = {
  id: string;
  nome: string;
  numeroAulas: number;
  preco: number;
};

export type ServicoRecord = {
  id: string;
  nome: string;
  modalidade: string;
  duracao: number;
  sobre: string;
  avulsoDisponivel: boolean;
  avulsoPreco: number;
  categoria: string | null;
  totalLessons: number | null;
  packs: PackOption[];
  vezesUsado: number;
};

export async function getServicos(schoolId: string): Promise<ServicoRecord[]> {
  const supabase = await createClient();

  const { data: classTypes } = await supabase
    .from("class_types")
    .select("id, name, modality, default_duration_minutes, description, price_cents, avulso_enabled, category, total_lessons")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!classTypes) return [];

  const ctIds = classTypes.map((ct) => ct.id);

  const [packsRes, sessionsRes] = await Promise.all([
    ctIds.length > 0
      ? supabase
          .from("packs")
          .select("id, name, total_lessons, price_cents, class_type_id")
          .in("class_type_id", ctIds)
          .eq("is_active", true)
      : { data: [] as { id: string; name: string; total_lessons: number; price_cents: number; class_type_id: string }[] },
    ctIds.length > 0
      ? supabase
          .from("sessions")
          .select("class_type_id, id")
          .in("class_type_id", ctIds)
          .eq("school_id", schoolId)
      : { data: [] as { class_type_id: string; id: string }[] },
  ]);

  const packsByCt: Record<string, PackOption[]> = {};
  for (const p of packsRes.data ?? []) {
    if (!packsByCt[p.class_type_id]) packsByCt[p.class_type_id] = [];
    packsByCt[p.class_type_id].push({
      id: p.id,
      nome: p.name,
      numeroAulas: p.total_lessons,
      preco: p.price_cents,
    });
  }

  const sessionIds = (sessionsRes.data ?? []).map((s) => s.id);
  const { data: bookings } = sessionIds.length > 0
    ? await supabase
        .from("bookings")
        .select("session_id")
        .in("session_id", sessionIds)
        .eq("status", "confirmed")
    : { data: [] as { session_id: string }[] };

  const bookingCountPerSession: Record<string, number> = {};
  for (const b of bookings ?? []) {
    bookingCountPerSession[b.session_id] = (bookingCountPerSession[b.session_id] ?? 0) + 1;
  }

  const allPackIds = Object.values(packsByCt).flat().map((p) => p.id);
  const { data: packPurchases } = allPackIds.length > 0
    ? await supabase
        .from("pack_purchases")
        .select("pack_id")
        .in("pack_id", allPackIds)
    : { data: [] as { pack_id: string }[] };

  const packUsageCount: Record<string, number> = {};
  for (const pp of packPurchases ?? []) {
    packUsageCount[pp.pack_id] = (packUsageCount[pp.pack_id] ?? 0) + 1;
  }

  const result: ServicoRecord[] = [];

  for (const ct of classTypes) {
    const ctPacks = packsByCt[ct.id] ?? [];
    const ctSessionIds = (sessionsRes.data ?? [])
      .filter((s) => s.class_type_id === ct.id)
      .map((s) => s.id);

    let vezesUsado = 0;
    for (const sid of ctSessionIds) {
      vezesUsado += bookingCountPerSession[sid] ?? 0;
    }
    for (const p of ctPacks) {
      vezesUsado += packUsageCount[p.id] ?? 0;
    }

    result.push({
      id: ct.id,
      nome: ct.name,
      modalidade: ct.modality ?? "",
      duracao: ct.default_duration_minutes,
      sobre: ct.description ?? "",
      avulsoDisponivel: ct.avulso_enabled,
      avulsoPreco: ct.price_cents,
      categoria: ct.category ?? null,
      totalLessons: ct.total_lessons,
      packs: ctPacks,
      vezesUsado,
    });
  }

  return result;
}

export async function addServico(
  schoolId: string,
  data: {
    nome: string;
    modalidade: string;
    duracao: number;
    sobre?: string;
    avulsoDisponivel: boolean;
    avulsoPreco: number;
    categoria?: "aula" | "pack" | "aluguer";
    totalLessons?: number;
    packs: { nome: string; numeroAulas: number; preco: number }[];
  }
): Promise<{ ok: boolean; error?: string }> {
  const parsed = servicoBaseSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "addServico");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { data: created, error: ctErr } = await supabase
    .from("class_types")
    .insert({
      school_id: schoolId,
      name: data.nome,
      modality: data.modalidade,
      default_duration_minutes: data.duracao,
      price_cents: data.avulsoPreco,
      avulso_enabled: data.avulsoDisponivel,
      description: data.sobre ?? "",
      category: data.categoria ?? null,
      total_lessons: data.totalLessons ?? null,
    })
    .select("id")
    .single();

  if (ctErr) return { ok: false, error: ctErr.message };

  if (data.packs.length > 0) {
    const { error: pErr } = await supabase.from("packs").insert(
      data.packs.map((p) => ({
        school_id: schoolId,
        class_type_id: created.id,
        name: p.nome,
        total_lessons: p.numeroAulas,
        price_cents: p.preco,
      }))
    );
    if (pErr) return { ok: false, error: pErr.message };
  }

  logAudit({
    schoolId,
    userId: user.id,
    action: "add_servico",
    entityType: "class_type",
    entityId: created.id,
    metadata: { nome: data.nome, packsCount: data.packs.length },
  });

  return { ok: true };
}

export async function deleteServico(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "deleteServico");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  // Nullify class_type_id on sessions first (FK has on delete restrict)
  const { error: nullifyErr } = await supabase
    .from("sessions")
    .update({ class_type_id: null })
    .eq("class_type_id", id);

  if (nullifyErr) return { ok: false, error: nullifyErr.message };

  // Also delete associated packs (they cascade from class_types)
  const { error } = await supabase.from("class_types").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  logAudit({
    schoolId: null,
    userId: user.id,
    action: "delete_servico",
    entityType: "class_type",
    entityId: id,
  });

  return { ok: true };
}

export async function updateServico(
  id: string,
  data: {
    nome: string;
    modalidade: string;
    duracao: number;
    sobre?: string;
    avulsoDisponivel: boolean;
    avulsoPreco: number;
    categoria?: "aula" | "pack" | "aluguer";
    totalLessons?: number;
    packs: { id?: string; nome: string; numeroAulas: number; preco: number }[];
  }
): Promise<{ ok: boolean; error?: string }> {
  const parsed = servicoBaseSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rl = await rateLimitByUser(user.id, "updateServico");
  if (!rl.ok) return { ok: false, error: "Muitos pedidos. Tenta novamente mais tarde." };

  const { error: ctErr } = await supabase
    .from("class_types")
    .update({
      name: data.nome,
      modality: data.modalidade,
      default_duration_minutes: data.duracao,
      price_cents: data.avulsoPreco,
      avulso_enabled: data.avulsoDisponivel,
      description: data.sobre ?? "",
      category: data.categoria ?? null,
      total_lessons: data.totalLessons ?? null,
    })
    .eq("id", id);

  if (ctErr) return { ok: false, error: ctErr.message };

  // sync packs: diff incoming vs existing
  const incomingIds = data.packs.filter((p) => p.id).map((p) => p.id!);
  const { data: existingPacks } = await supabase
    .from("packs")
    .select("id")
    .eq("class_type_id", id);

  const toDelete = (existingPacks ?? [])
    .map((p) => p.id)
    .filter((pid) => !incomingIds.includes(pid));

  if (toDelete.length > 0) {
    await supabase.from("packs").delete().in("id", toDelete);
  }

  const { data: ct } = await supabase
    .from("class_types")
    .select("school_id")
    .eq("id", id)
    .single();

  const newPacks = data.packs.filter((p) => !p.id);
  for (const p of data.packs) {
    if (p.id) {
      await supabase
        .from("packs")
        .update({ name: p.nome, total_lessons: p.numeroAulas, price_cents: p.preco })
        .eq("id", p.id);
    }
  }

  if (newPacks.length > 0 && ct) {
    const { error: pErr } = await supabase.from("packs").insert(
      newPacks.map((p) => ({
        school_id: ct.school_id,
        class_type_id: id,
        name: p.nome,
        total_lessons: p.numeroAulas,
        price_cents: p.preco,
      }))
    );
    if (pErr) return { ok: false, error: pErr.message };
  }

  if (ct) {
    logAudit({
      schoolId: ct.school_id,
      userId: user.id,
      action: "update_servico",
      entityType: "class_type",
      entityId: id,
      metadata: { nome: data.nome, packsCount: data.packs.length },
    });
  }

  return { ok: true };
}
