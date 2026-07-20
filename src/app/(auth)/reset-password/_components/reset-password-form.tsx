"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { passwordRules } from "@/lib/validation/signup-owner";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "../actions";
import { cn } from "@/lib/utils/cn";

type FieldErrors = Partial<{ password: string; confirmPassword: string }>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [pending, startTransition] = useTransition();

  // Quando o user clica no link do email, o Supabase coloca o token no hash da URL.
  // O cliente do browser detecta isso automaticamente e estabelece sessão temporária.
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionReady(true);
      }
    });

    // Verificar se já existe sessão (caso o evento já tenha disparado)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });
  }, []);

  const ruleResults = useMemo(
    () => passwordRules.map((r) => ({ ...r, ok: r.test(password) })),
    [password]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError(undefined);

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});

    startTransition(async () => {
      const result = await updatePassword({
        password: parsed.data.password,
        confirmPassword: parsed.data.confirmPassword,
      });

      if (!result.ok) {
        setGeneralError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    });
  }

  if (success) {
    return (
      <AuthShell>
        <div className="mt-2 flex flex-col gap-4 text-center md:mt-6">
          <h1 className="font-heading text-2xl font-medium">Password actualizada!</h1>
          <p className="text-sm text-text-secondary">
            A redireccionar para o login...
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <header className="mt-2 lg:mt-8">
        <h1 className="font-heading text-2xl font-medium">Nova password</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Define uma nova password para a tua conta.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
        <div>
          <Input
            label="Nova password"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="Insira a nova password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          {password.length > 0 && (
            <ul className="mt-2 space-y-1">
              {ruleResults.map((r) => (
                <li
                  key={r.id}
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    r.ok ? "text-success" : "text-text-muted"
                  )}
                >
                  <span aria-hidden>{r.ok ? "✓" : "○"}</span>
                  {r.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Input
          label="Confirmar password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repete a password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />

        {generalError && (
          <p className="text-center text-sm text-error">{generalError}</p>
        )}

        {!sessionReady && (
          <p className="text-center text-xs text-text-muted">
            A validar o link de recuperação...
          </p>
        )}

        <Button
          type="submit"
          fullWidth
          loading={pending}
          disabled={!sessionReady}
          className="mt-2"
        >
          Actualizar password
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link href="/login" className="text-accent hover:underline">
          Voltar ao login
        </Link>
      </div>
    </AuthShell>
  );
}