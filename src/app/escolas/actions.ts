"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type SchoolSearchResult = {
  name: string;
  slug: string;
  location: string | null;
  logo_url: string | null;
};

export type ShowcasedSchool = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  photo_url: string | null;
  rating_avg: number;
  rating_count: number;
  class_types_count: number;
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

export async function getShowcasedSchools(): Promise<ShowcasedSchool[]> {
  const admin = createAdminClient();
  const IMAGE_BUCKET = "school-images";

  const { data, error } = await admin
    .from("schools")
    .select("id, name, slug, location, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("[getShowcasedSchools] error:", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  const schoolIds = data.map((s) => s.id);

  const { data: images } = await admin
    .from("school_images")
    .select("school_id, file_path")
    .in("school_id", schoolIds)
    .order("created_at", { ascending: true });

  const imageMap: Record<string, string> = {};
  for (const img of images ?? []) {
    if (!imageMap[img.school_id]) {
      imageMap[img.school_id] = admin.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(img.file_path).data.publicUrl;
    }
  }

  return data.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    location: s.location,
    photo_url: imageMap[s.id] ?? null,
    rating_avg: 0,
    rating_count: 0,
    class_types_count: 0,
  }));
}
