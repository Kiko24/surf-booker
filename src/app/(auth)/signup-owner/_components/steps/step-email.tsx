"use client";

import { useEffect, useRef, useState } from "react";
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const emailRef = useRef(email);
  const onSubmitRef = useRef(onSubmit);

  useEffect(() => {
    emailRef.current = email;
    onSubmitRef.current = onSubmit;
  }, [email, onSubmit]);

  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    function handleClick() {
      const result = emailStepSchema.safeParse({ email: emailRef.current });
      if (!result.success) {
        setError(result.error.issues[0]?.message ?? "Email inválido");
        return;
      }
      setError(undefined);
      onSubmitRef.current(result.data.email);
    }

    btn.addEventListener("click", handleClick);
    return () => btn.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      <Input
        className="mt-6"
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
            const result = emailStepSchema.safeParse({ email: emailRef.current });
            if (!result.success) {
              setError(result.error.issues[0]?.message ?? "Email inválido");
              return;
            }
            setError(undefined);
            onSubmitRef.current(result.data.email);
          }
        }}
        error={error}
      />

      <div className="mt-10 lg:mt-6">
        <Button type="button" ref={buttonRef} fullWidth>
          Continuar
        </Button>
      </div>

      <div className="mt-6">
        <Divider label="Ou" />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <SocialButtons
          onProviderClick={(p) => {
          }}
        />
      </div>
    </>
  );
}