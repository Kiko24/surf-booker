"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type SchoolSearchResult = {
  name: string;
  slug: string;
  location: string | null;
  logo_url: string | null;
};

export async function searchSchools(
  query: string,
  limit: number
): Promise<SchoolSearchResult[]> {
  const admin = createAdminClient();
  const sanitized = query.trim().slice(0, 100);
  const { data, error } = await admin
    .from("schools")
    .select("name, slug, location, logo_url")
    .or(`name.ilike.%${sanitized}%,location.ilike.%${sanitized}%`)
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[searchSchools] error:", error);
    return [];
  }

  const LOGO_BUCKET = "school-logos";

  return (data ?? []).map((s) => ({
    name: s.name,
    slug: s.slug,
    location: s.location,
    logo_url: s.logo_url
      ? admin.storage.from(LOGO_BUCKET).getPublicUrl(s.logo_url).data.publicUrl
      : null,
  }));
}
