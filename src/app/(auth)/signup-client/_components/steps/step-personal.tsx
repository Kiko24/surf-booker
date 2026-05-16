"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CountrySelect } from "@/components/auth/country-select";
import { PhoneInput } from "@/components/auth/phone-input";
import {
  personalStepSchema,
  passwordRules,
  type CountryCode,
} from "@/lib/validation/signup-owner";
import { signupClient } from "../../actions";
import { cn } from "@/lib/utils/cn";

type Props = {
  email: string;
  onSuccess: () => void;
  onEmailConflict: () => void;
};

type FieldErrors = Partial<{
  name: string;
  password: string;
  phone: string;
  country: string;
  acceptedTerms: string;
}>;

export function StepPersonal({ email, onSuccess, onEmailConflict }: Props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<CountryCode>("PT");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | undefined>();
  const [emailConflict, setEmailConflict] = useState(false);
  const [pending, startTransition] = useTransition();

  const ruleResults = useMemo(
    () => passwordRules.map((r) => ({ ...r, ok: r.test(password) })),
    [password]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError(undefined);
    setEmailConflict(false);

    const parsed = personalStepSchema.safeParse({
      name,
      password,
      phone,
      country,
      acceptedTerms,
    });

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
      const result = await signupClient({
        email,
        name: parsed.data.name,
        password: parsed.data.password,
        phone: parsed.data.phone,
        country: parsed.data.country,
        acceptedTerms: parsed.data.acceptedTerms,
      });

      if (!result.ok) {
        if (result.field === "email") {
          setEmailConflict(true);
          return;
        }
        setGeneralError(result.error);
        return;
      }

      onSuccess();
    });
  }

  return (
    <div className="flex flex-col gap-6 lg:mt-12 lg:gap-2">
      <header className="mt-2">
        <h1 className="font-heading text-2xl font-medium">Falta só um pouco!</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Preencha os restantes passos para associar{" "}
          <span className="text-foreground">{email}</span> à sua conta!
        </p>
      </header>

      {emailConflict && (
        <div className="rounded-xl border border-error/40 bg-error/10 p-3 text-sm">
          <p className="text-foreground">
            Já existe uma conta com <strong>{email}</strong>.
          </p>
          <p className="mt-1 text-text-secondary">
            <Link href="/login" className="text-accent hover:underline">
              Iniciar sessão
            </Link>{" "}
            ou{" "}
            <button
              type="button"
              onClick={onEmailConflict}
              className="text-accent hover:underline"
            >
              usar outro email
            </button>
            .
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Nome"
          name="name"
          autoComplete="name"
          placeholder="Insira o seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <div>
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Insira uma password"
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

        <PhoneInput value={phone} onChange={setPhone} error={errors.phone} />

        <CountrySelect value={country} onChange={setCountry} />

        <label className="flex cursor-pointer items-start gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 h-4 w-4 cursor-pointer accent-accent"
          />
          <span>
            Confirmo que aceito os{" "}
            <Link href="/terms" className="text-accent hover:underline">
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="text-accent hover:underline">
              Políticas de Privacidade
            </Link>
          </span>
        </label>
        {errors.acceptedTerms && (
          <p className="-mt-2 text-xs text-error">{errors.acceptedTerms}</p>
        )}

        {generalError && (
          <p className="text-center text-sm text-error">{generalError}</p>
        )}

        <Button type="submit" fullWidth loading={pending}>
          Criar conta
        </Button>
      </form>
    </div>
  );
}