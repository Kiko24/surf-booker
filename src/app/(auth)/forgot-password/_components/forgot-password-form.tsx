"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { sendResetEmail } from "../actions";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = forgotPasswordSchema.safeParse({ email });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Email inválido");
      return;
    }

    setError(undefined);

    startTransition(async () => {
      const result = await sendResetEmail(parsed.data.email);

      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (submitted) {
    return (
      <AuthShell backHref="/login">
        <div className="mt-2 flex flex-col gap-6 text-center">
          <header className="md:mt-4">
            <h1 className="font-heading text-2xl font-medium">Verifica o teu email</h1>
          </header>

          <p className="text-sm text-text-secondary">
            Se houver uma conta associada a <span className="text-foreground">{email}</span>,
            enviámos um link para redefinir a password.
          </p>

          <Link
            href="/login"
            className="text-sm text-accent hover:underline"
          >
            Voltar ao login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell backHref="/login" title="Recuperar password">
      <header className="hidden lg:block">
        <h1 className="font-heading text-2xl font-medium">Recuperar password</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Insere o teu email e enviámos-te um link para definir uma nova password.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
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
            if (error) setError(undefined);
          }}
          error={error}
        />

        <Button type="submit" fullWidth loading={pending} className="mt-2 font-semibold">
          Enviar link
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