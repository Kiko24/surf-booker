import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRedirectByRole } from "@/lib/auth/redirect-by-role";
import { SignupOwnerWizard } from "./_components/signup-owner-wizard";

export default async function SignupOwnerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const destination = await getRedirectByRole(supabase, user.id);
    redirect(destination);
  }

  return <SignupOwnerWizard />;
}