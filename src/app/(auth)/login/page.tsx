import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRedirectByRole, isSafeNextPath } from "@/lib/auth/redirect-by-role";
import { LoginForm } from "./_components/login-form";

export const metadata = {
  title: "Iniciar sessão | SurfBooker",
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { next } = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const safeNext = isSafeNextPath(next) ? next! : null;
    const destination = safeNext ?? (await getRedirectByRole(supabase, user.id));
    redirect(destination);
  }

  return <LoginForm nextPath={isSafeNextPath(next) ? next : undefined} />;
}