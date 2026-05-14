import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./_components/onboarding-form";

export const metadata = {
  title: "Criar a tua escola | SurfBooker",
};

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    redirect("/");
  }

  const { data: existingSchool } = await supabase
    .from("schools")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (existingSchool) {
    redirect("/dashboard");
  }

  return <OnboardingForm ownerName={profile.full_name ?? ""} />;
}