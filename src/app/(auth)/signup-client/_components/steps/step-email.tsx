"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/auth/divider";
import { SocialButtons } from "@/components/auth/social-buttons";
import { emailStepSchema } from "@/lib/validation/signup-owner";

type Props = {
  defaultEmail?: string;
  onSubmit: (email: string) => void;
};

export function StepEmail({ defaultEmail = "", onSubmit }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | undefined>();

  function handleContinue() {
    const result = emailStepSchema.safeParse({ email });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Email inválido");
      return;
    }

    setError(undefined);
    onSubmit(result.data.email);
  }

  return (
    <div className="lg:mt-8">
      <header className="mt-2 text-center">
        <h1 className="font-heading text-2xl font-medium">Marca sessões facilmente</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Crie uma conta para marcar sessões mais rapidamente!
        </p>
      </header>

      <div className="mt-10 lg:mt-6">
        <Input
          type="email"
          name="email"
          placeholder="Insira o seu e-mail"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(undefined);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleContinue();
            }
          }}
          error={error}
        />

        <div className="mt-10 lg:mt-6">
          <Button type="button" onClick={handleContinue} fullWidth>
            Continuar
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Divider label="Ou" />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <SocialButtons
          onProviderClick={(p) => {
            console.log("provider:", p);
          }}
        />
      </div>

      <div className="mt-6 text-center text-sm">
        <p className="text-text-secondary">Tem um negócio?</p>
        <Link
          href="/signup-owner"
          className="mt-2 inline-block text-accent hover:underline"
        >
          Clique aqui!
        </Link>
      </div>
    </div>
  );
}