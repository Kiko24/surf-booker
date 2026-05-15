"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FreguesiaCombobox } from "./freguesia-combobox";
import { LogoUploader } from "./logo-upload";
import { onboardingSchema } from "@/lib/validation/onboarding";
import { createSchool } from "../actions";

type Props = {
  ownerName: string;
};

type FieldErrors = Partial<{
  name: string;
  location: string;
  description: string;
  logo: string;
}>;

export function OnboardingForm({ ownerName }: Props) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const firstName = ownerName.split(" ")[0] || "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError(undefined);

    const parsed = onboardingSchema.safeParse({
      name,
      location,
      description,
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
      const formData = new FormData();
      formData.append("name", parsed.data.name);
      formData.append("location", parsed.data.location);
      if (parsed.data.description) {
        formData.append("description", parsed.data.description);
      }
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const result = await createSchool(formData);

      if (result && !result.ok) {
        if (result.field) {
          setErrors({ [result.field]: result.error });
        } else {
          setGeneralError(result.error);
        }
      }
      // Se ok, a action faz redirect
    });
  }

  return (
    <div className="min-h-svh bg-background text-foreground font-body">
      <main className="mx-auto flex max-w-md flex-col px-5 py-8 sm:px-6">
        <header className="mt-2">
          <h1 className="font-heading text-3xl font-medium">
            Bem-vindo {firstName}!
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Vamos registar o teu negócio para que possamos trabalhar juntos!
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-5 lg:mt-4">
          <Input
            label="Nome do negócio"
            name="name"
            placeholder="Ex: Oporto's Surf School"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />

          <FreguesiaCombobox
            value={location}
            onChange={setLocation}
            error={errors.location}
          />

          <div>
  <label className="mb-2 block text-sm font-medium text-foreground">
    Sobre <span className="text-text-muted">(opcional)</span>
  </label>

  <div className="rounded-lg border border-border bg-surface px-4 py-3 focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-background">
    <textarea
      name="description"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      placeholder="Conta-nos um pouco sobre a tua escola..."
      rows={3}
      maxLength={1000}
      className="w-full resize-none bg-transparent leading-relaxed text-foreground focus:outline-none"
    />
  </div>

  {errors.description && (
    <p className="mt-1.5 text-xs text-error">{errors.description}</p>
  )}
</div>

          <LogoUploader onChange={setLogoFile} error={errors.logo} />

          {generalError && (
            <p className="text-center text-sm text-error">{generalError}</p>
          )}

          <Button type="submit" fullWidth loading={pending} className="mt-2 font-semibold">
            Concluir registo
          </Button>
        </form>
      </main>
    </div>
  );
}