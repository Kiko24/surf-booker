"use server";

import { createClient } from "@/lib/supabase/server";
import { getSchoolId } from "@/lib/school";

type SessionClassTypeId = { class_type_id: string | null };
type SessionStartsAt = { starts_at: string };

export type MetricasData = {
  receita: {
    total: number;
    por_tipo: { metodo: string; total: number }[];
    por_servico: { nome: string; total: number }[];
    comparativo: number;
  };
  ocupacao: {
    taxa_media: number;
    realizadas: number;
    canceladas: number;
    mais_popular: { dia: string; hora: string; count: number } | null;
    menos_ocupada: { nome: string; alunos: number; capacidade: number } | null;
    comparativo: number;
  };
  alunos: {
    total_unicos: number;
    novos: number;
    com_pack: number;
    inativos: number;
  };
  noshow: {
    taxa: number;
    comparativo: number;
    recorrentes: { id: string; nome: string; count: number }[];
  };
  sazonalidade: {
    receita_verao: number;
    receita_inverno: number;
    ocupacao_verao: number;
    ocupacao_inverno: number;
    mes_max: { mes: number; total: number } | null;
    mes_min: { mes: number; total: number } | null;
  };
  instrutores: { nome: string; total: number }[];
};

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function dateRange(filter: string, amount?: number, unit?: string): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;

  switch (filter) {
    case "esta_semana": {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start = new Date(now);
      start.setDate(now.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "este_mes":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "epoca_alta":
      start = new Date(now.getFullYear(), 4, 1);
      break;
    default: {
      start = new Date(now);
      const amt = amount ?? 30;
      if (unit === "months") start.setMonth(start.getMonth() - amt);
      else if (unit === "years") start.setFullYear(start.getFullYear() - amt);
      else start.setDate(start.getDate() - amt);
      break;
    }
  }

  return { start, end: now };
}

export async function getMetricas(
  filter: string,
  customAmount?: number,
  customUnit?: string
): Promise<MetricasData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const schoolId = await getSchoolId();
  if (!schoolId) return null;

  const { start, end } = dateRange(filter, customAmount, customUnit);
  const startStr = start.toISOString();
  const endStr = end.toISOString();

  const diffMs = end.getTime() - start.getTime();
  const startPrev = new Date(start.getTime() - diffMs);
  const endPrev = new Date(start);
  const startPrevStr = startPrev.toISOString();
  const endPrevStr = endPrev.toISOString();

  // ─── RECEITA ────────────────────────────────────────────
  const { data: bookingsRevenue } = await supabase
    .from("bookings")
    .select("price_cents, payment_method, session_id!inner(starts_at, class_type_id, school_id)")
    .in("status", ["confirmed", "attended"])
    .eq("session_id.school_id", schoolId)
    .gte("session_id.starts_at", startStr)
    .lt("session_id.starts_at", endStr);

  const totalReceita = (bookingsRevenue ?? []).reduce((s, b) => s + (b.price_cents ?? 0), 0);

  const porTipoMap: Record<string, number> = {};
  for (const b of bookingsRevenue ?? []) {
    const metodo = b.payment_method === "pack" ? "Pack" : "Avulso";
    porTipoMap[metodo] = (porTipoMap[metodo] ?? 0) + (b.price_cents ?? 0);
  }
  const porTipo = Object.entries(porTipoMap).map(([metodo, total]) => ({ metodo, total }));

  const { data: classTypes } = await supabase
    .from("class_types")
    .select("id, name")
    .eq("school_id", schoolId);

  const ctMap = new Map((classTypes ?? []).map(ct => [ct.id, ct.name]));
  const porServicoMap: Record<string, number> = {};
  for (const b of bookingsRevenue ?? []) {
    const ctId = (b.session_id as unknown as SessionClassTypeId).class_type_id;
    const nome = ctId ? (ctMap.get(ctId) ?? "Sem Serviço") : "Sem Serviço";
    porServicoMap[nome] = (porServicoMap[nome] ?? 0) + (b.price_cents ?? 0);
  }
  const porServico = Object.entries(porServicoMap).map(([nome, total]) => ({ nome, total }));

  const { data: prevRevenue } = await supabase
    .from("bookings")
    .select("price_cents, session_id!inner(starts_at, school_id)")
    .in("status", ["confirmed", "attended"])
    .eq("session_id.school_id", schoolId)
    .gte("session_id.starts_at", startPrevStr)
    .lt("session_id.starts_at", endPrevStr);

  const totalPrev = (prevRevenue ?? []).reduce((s, b) => s + (b.price_cents ?? 0), 0);
  const comparativoReceita = totalPrev > 0 ? Math.round(((totalReceita - totalPrev) / totalPrev) * 100) : 0;

  // ─── OCUPAÇÃO ───────────────────────────────────────────
  const { data: sessionsPeriod } = await supabase
    .from("sessions")
    .select("id, starts_at, capacity, status, class_type_id")
    .eq("school_id", schoolId)
    .gte("starts_at", startStr)
    .lt("starts_at", endStr);

  const sessionIds = (sessionsPeriod ?? []).map(s => s.id);

  const { data: bookingsCount } = sessionIds.length > 0
    ? await supabase.from("bookings").select("session_id, id").in("session_id", sessionIds).in("status", ["confirmed", "attended"])
    : { data: [] };

  const countPerSession: Record<string, number> = {};
  for (const b of bookingsCount ?? []) {
    countPerSession[b.session_id] = (countPerSession[b.session_id] ?? 0) + 1;
  }

  let totalTaxa = 0;
  let taxaCount = 0;
  let realizadas = 0;
  let canceladas = 0;
  const diaHoraCount: Record<string, { dia: string; hora: string; count: number }> = {};
  let maisPopular: MetricasData["ocupacao"]["mais_popular"] = null;
  let menosOcupada: MetricasData["ocupacao"]["menos_ocupada"] = null;

  for (const s of sessionsPeriod ?? []) {
    if (s.status === "cancelled") { canceladas++; continue; }
    realizadas++;
    const alunos = countPerSession[s.id] ?? 0;
    const cap = s.capacity ?? 10;
    if (cap > 0) { totalTaxa += alunos / cap; taxaCount++; }
    const d = new Date(s.starts_at);
    const dia = WEEKDAYS[d.getDay()];
    const hora = `${d.getHours().toString().padStart(2, "0")}:00`;
    const key = `${dia}|${hora}`;
    if (!diaHoraCount[key]) diaHoraCount[key] = { dia, hora, count: 0 };
    diaHoraCount[key].count += alunos;

    const razao = cap > 0 ? alunos / cap : 1;
    if (!menosOcupada || razao < (menosOcupada.alunos / menosOcupada.capacidade)) {
      const nome = s.class_type_id ? (ctMap.get(s.class_type_id) ?? "Aula") : "Aula";
      menosOcupada = { nome, alunos, capacidade: cap };
    }
  }

  const taxaMedia = taxaCount > 0 ? Math.round((totalTaxa / taxaCount) * 100) : 0;
  maisPopular = Object.values(diaHoraCount).sort((a, b) => b.count - a.count)[0] ?? null;

  // ─── OCUPAÇÃO PERÍODO ANTERIOR ─────────────────────────
  const { data: prevSessions } = await supabase
    .from("sessions")
    .select("id, capacity, status")
    .eq("school_id", schoolId)
    .gte("starts_at", startPrevStr)
    .lt("starts_at", endPrevStr);

  const prevSessionIds = (prevSessions ?? []).map(s => s.id);
  const { data: prevBookings } = prevSessionIds.length > 0
    ? await supabase.from("bookings").select("session_id").in("session_id", prevSessionIds).in("status", ["confirmed", "attended"])
    : { data: [] };

  const prevCountPerSession: Record<string, number> = {};
  for (const b of prevBookings ?? []) {
    prevCountPerSession[b.session_id] = (prevCountPerSession[b.session_id] ?? 0) + 1;
  }

  let prevTotalTaxa = 0;
  let prevTaxaCount = 0;
  for (const s of prevSessions ?? []) {
    if (s.status === "cancelled") continue;
    const alunos = prevCountPerSession[s.id] ?? 0;
    const cap = s.capacity ?? 10;
    if (cap > 0) { prevTotalTaxa += alunos / cap; prevTaxaCount++; }
  }
  const prevTaxaMedia = prevTaxaCount > 0 ? Math.round((prevTotalTaxa / prevTaxaCount) * 100) : 0;
  const comparativoOcupacao = prevTaxaMedia > 0 ? Math.round(((taxaMedia - prevTaxaMedia) / prevTaxaMedia) * 100) : 0;

  // ─── ALUNOS ─────────────────────────────────────────────
  const { data: bookingsStudents } = await supabase
    .from("bookings")
    .select("student_id, status")
    .in("status", ["confirmed", "attended", "no_show"])
    .in("session_id", sessionIds);

  const uniqueStudents = new Set((bookingsStudents ?? []).map(b => b.student_id));
  const totalUnicos = uniqueStudents.size;

  let novos = 0;
  for (const sid of uniqueStudents) {
    const { data: firstB } = await supabase
      .from("bookings")
      .select("session_id!inner(starts_at)")
      .eq("student_id", sid)
      .order("session_id.starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (firstB) {
      const d = new Date((firstB.session_id as unknown as SessionStartsAt).starts_at);
      if (d >= start && d <= end) novos++;
    }
  }

  const { data: packPurchases } = await supabase
    .from("pack_purchases")
    .select("student_id")
    .eq("school_id", schoolId)
    .eq("status", "active");

  const studentsWithPack = new Set((packPurchases ?? []).map(pp => pp.student_id));

  const trintaDias = new Date(); trintaDias.setDate(trintaDias.getDate() - 30);
  let inativos = 0;
  for (const sid of uniqueStudents) {
    const { data: lastB } = await supabase
      .from("bookings")
      .select("session_id!inner(starts_at)")
      .eq("student_id", sid)
      .order("session_id.starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastB) {
      const d = new Date((lastB.session_id as unknown as SessionStartsAt).starts_at);
      if (d < trintaDias) inativos++;
    }
  }

  // ─── NO-SHOW ────────────────────────────────────────────
  const totalBookings = (bookingsStudents ?? []).length;
  const noshowCount = (bookingsStudents ?? []).filter(b => b.status === "no_show").length;
  const taxaNoshow = totalBookings > 0 ? Math.round((noshowCount / totalBookings) * 100) : 0;

  const { data: prevNoshowB } = await supabase
    .from("bookings")
    .select("status, session_id!inner(starts_at, school_id)")
    .eq("session_id.school_id", schoolId)
    .gte("session_id.starts_at", startPrevStr)
    .lt("session_id.starts_at", endPrevStr);

  const prevTotalB = (prevNoshowB ?? []).length;
  const prevNoshowCount = (prevNoshowB ?? []).filter(b => b.status === "no_show").length;
  const prevTaxaNoshow = prevTotalB > 0 ? Math.round((prevNoshowCount / prevTotalB) * 100) : 0;
  const comparativoNoshow = prevTaxaNoshow > 0 ? Math.round(((taxaNoshow - prevTaxaNoshow) / prevTaxaNoshow) * 100) : 0;

  const nsc: Record<string, number> = {};
  for (const b of bookingsStudents ?? []) { if (b.status === "no_show") nsc[b.student_id] = (nsc[b.student_id] ?? 0) + 1; }
  const noshowRecorrentes: MetricasData["noshow"]["recorrentes"] = [];
  for (const [id, count] of Object.entries(nsc)) {
    if (count >= 2) {
      const { data: st } = await supabase.from("students").select("full_name").eq("id", id).single();
      noshowRecorrentes.push({ id, nome: st?.full_name ?? "Desconhecido", count });
    }
  }

  // ─── SAZONALIDADE ────────────────────────────────────────
  const anoAtual = new Date().getFullYear();
  const { data: yearRevenue } = await supabase
    .from("bookings")
    .select("price_cents, session_id!inner(starts_at, school_id)")
    .in("status", ["confirmed", "attended"])
    .eq("session_id.school_id", schoolId)
    .gte("session_id.starts_at", new Date(anoAtual, 0, 1).toISOString())
    .lt("session_id.starts_at", new Date(anoAtual + 1, 0, 1).toISOString());

  let receitaVerao = 0, receitaInverno = 0;
  let sessoesVerao = 0, sessoesInverno = 0;
  let ocupVeraoTotal = 0, ocupInvernoTotal = 0;
  const mesRevenue: Record<number, number> = {};

  for (const b of yearRevenue ?? []) {
    const d = new Date((b.session_id as unknown as SessionStartsAt).starts_at);
    const mes = d.getMonth() + 1;
    mesRevenue[mes] = (mesRevenue[mes] ?? 0) + (b.price_cents ?? 0);
    if (mes >= 6 && mes <= 9) { receitaVerao += b.price_cents ?? 0; sessoesVerao++; }
    else { receitaInverno += b.price_cents ?? 0; sessoesInverno++; }
  }

  for (const s of sessionsPeriod ?? []) {
    const d = new Date(s.starts_at);
    const mes = d.getMonth() + 1;
    const alunos = countPerSession[s.id] ?? 0;
    const cap = s.capacity ?? 10;
    const taxa = cap > 0 ? alunos / cap : 0;
    if (mes >= 6 && mes <= 9) ocupVeraoTotal += taxa;
    else ocupInvernoTotal += taxa;
  }

  const ocupVerao = sessoesVerao > 0 ? Math.round((ocupVeraoTotal / sessoesVerao) * 100) : 0;
  const ocupInverno = sessoesInverno > 0 ? Math.round((ocupInvernoTotal / sessoesInverno) * 100) : 0;

  const entries = Object.entries(mesRevenue).map(([k, v]) => ({ mes: Number(k), total: v }));
  const mesMax = entries.sort((a, b) => b.total - a.total)[0] ?? null;
  const mesMin = entries.sort((a, b) => a.total - b.total)[0] ?? null;

  // ─── INSTRUTORES ─────────────────────────────────────────
  const { data: instrutorSessions } = await supabase
    .from("sessions")
    .select("instructor_id, instructors!inner(name)")
    .eq("school_id", schoolId)
    .eq("status", "scheduled")
    .not("instructor_id", "is", null)
    .gte("starts_at", startStr)
    .lt("starts_at", endStr);

  const instrutorCount: Record<string, { nome: string; total: number }> = {};
  for (const s of instrutorSessions ?? []) {
    const nome = (s.instructors as unknown as { name: string })?.name ?? "Desconhecido";
    if (!instrutorCount[s.instructor_id!]) instrutorCount[s.instructor_id!] = { nome, total: 0 };
    instrutorCount[s.instructor_id!].total++;
  }

  // fetch all instructors even if no sessions
  const { data: allInstructors } = await supabase
    .from("instructors")
    .select("name")
    .eq("school_id", schoolId)
    .order("name");

  for (const inst of allInstructors ?? []) {
    if (!Object.values(instrutorCount).some((c) => c.nome === inst.name)) {
      instrutorCount[inst.name] = { nome: inst.name, total: 0 };
    }
  }
  const instrutores = Object.values(instrutorCount).sort((a, b) => b.total - a.total);

  return {
    receita: { total: totalReceita, por_tipo: porTipo, por_servico: porServico, comparativo: comparativoReceita },
    ocupacao: { taxa_media: taxaMedia, realizadas, canceladas, mais_popular: maisPopular, menos_ocupada: menosOcupada, comparativo: comparativoOcupacao },
    alunos: { total_unicos: totalUnicos, novos, com_pack: studentsWithPack.size, inativos },
    noshow: { taxa: taxaNoshow, comparativo: comparativoNoshow, recorrentes: noshowRecorrentes },
    sazonalidade: {
      receita_verao: receitaVerao,
      receita_inverno: receitaInverno,
      ocupacao_verao: ocupVerao,
      ocupacao_inverno: ocupInverno,
    mes_max: mesMax,
    mes_min: mesMin,
  },
    instrutores,
  };
}
