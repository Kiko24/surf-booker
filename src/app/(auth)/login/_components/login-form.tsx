"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/auth/divider";
import { SocialButtons } from "@/components/auth/social-buttons";
import { AuthShell } from "@/components/auth/auth-shell";
import { loginSchema } from "@/lib/validation/auth";
import { signIn, resendConfirmationFromLogin } from "../actions";
import { cn } from "@/lib/utils/cn";

type Props = {
  nextPath?: string;
};

type FieldErrors = Partial<{ email: string; password: string }>;

export function LoginForm({ nextPath }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | undefined>();
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<
    { type: "success" | "error"; message: string } | undefined
  >();
  const [pending, startTransition] = useTransition();
  const [resending, startResendTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError(undefined);
    setNeedsConfirmation(false);
    setResendFeedback(undefined);

    const parsed = loginSchema.safeParse({ email, password });

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
      const result = await signIn({
        email: parsed.data.email,
        password: parsed.data.password,
        nextPath,
      });

      if (result && !result.ok) {
        if (result.code === "email_not_confirmed") {
          setNeedsConfirmation(true);
        }
        setGeneralError(result.error);
      }
    });
  }

  function handleResend() {
    setResendFeedback(undefined);

    startResendTransition(async () => {
      const result = await resendConfirmationFromLogin(email);

      if (result.ok) {
        setResendFeedback({
          type: "success",
          message: "Email reenviado. Verifica a tua caixa.",
        });
      } else {
        setResendFeedback({ type: "error", message: result.error });
      }
    });
  }

  return (
      <AuthShell backHref="/user-flow" mainClassName="pb-0">
      <header className="mt-2 text-center lg:mt-8">
        <h1 className="font-heading text-2xl font-medium">Bem-vindo de volta!</h1>
      </header>

      <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Insira o seu e-mail"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
        />

        <div>
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Insira a sua password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
          />
          <div className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-accent hover:underline"
            >
              Esqueceste-te da password?
            </Link>
          </div>
        </div>

        {generalError && (
          <div className="rounded-xl border border-error/40 bg-error/10 p-3 text-sm">
            <p className="text-foreground">{generalError}</p>

            {needsConfirmation && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-accent hover:underline disabled:opacity-50"
                >
                  {resending ? "A reenviar..." : "Reenviar email de confirmação"}
                </button>

                {resendFeedback && (
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      resendFeedback.type === "success" ? "text-success" : "text-error"
                    )}
                  >
                    {resendFeedback.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <Button type="submit" fullWidth loading={pending} className="mt-0">
          Iniciar sessão
        </Button>
      </form>

      <div className="mt-4">
        <Divider label="Ou" />
      </div>

      <div className="mt-4">
        <SocialButtons
          onProviderClick={(p) => {
            console.log("provider:", p);
          }}
        />
      </div>

      <div className="mt-3 text-center text-sm">
        <p className="text-text-secondary">Ainda não tens conta?</p>
        <Link
          href="/user-flow"
          className="mt-2 inline-block text-accent hover:underline"
        >
          Regista-te aqui!
        </Link>
      </div>
    </AuthShell>
  );
}