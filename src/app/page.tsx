import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LandingPageView } from "./_components/landing-page-view";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("user_id", user.id)
      .single();

    if (profile?.role === "owner") {
      redirect("/dashboard");
    }

    return (
      <LandingPageView
        user={{
          id: user.id,
          email: user.email ?? "",
          name: profile?.full_name ?? "",
        }}
      />
    );
  }

  return <LandingPageView user={null} />;
}
