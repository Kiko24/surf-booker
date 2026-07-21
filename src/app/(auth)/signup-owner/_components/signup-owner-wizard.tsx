"use client";

import { useState } from "react";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { StepTransition } from "@/components/auth/step-transition";
import { StepEmail } from "./steps/step-email";
import { StepPersonal } from "./steps/step-personal";
import { StepConfirmEmail } from "./steps/step-confirm-email";
import bgPros from "@/components/images/bg_pros.png";

type Step = "email" | "personal" | "confirm-email";

export function SignupOwnerWizard() {
  const [step, setStep] = useState<Step>("email");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [email, setEmail] = useState("");

  function goTo(next: Step, dir: "forward" | "backward" = "forward") {
    setDirection(dir);
    setStep(next);
  }

  function handleBackInternal() {
    if (step === "personal") {
      goTo("email", "backward");
      return;
    }
    if (step === "confirm-email") {
      goTo("email", "backward");
      setEmail("");
      return;
    }
  }

  const isFirstStep = step === "email";

  const stepTitles: Record<Step, string> = {
    email: "Tem o seu negócio?",
    personal: "Falta só um pouco!",
    "confirm-email": "Confirma o teu email",
  };

  const stepSubtitle: Record<Step, string | undefined> = {
    email: "Crie uma conta e deixe-nos ajudar!",
    personal: undefined,
    "confirm-email": undefined,
  };

  return (
    <AuthShell
      image={bgPros}
      backHref={isFirstStep ? "/user-flow" : undefined}
      onBack={isFirstStep ? undefined : handleBackInternal}
      title={stepTitles[step]}
      subtitle={stepSubtitle[step]}
      mainClassName="items-start"
    >
      <AuthHeader
        title={stepTitles[step]}
        subtitle={stepSubtitle[step]}
        backHref={isFirstStep ? "/user-flow" : undefined}
        onBack={isFirstStep ? undefined : handleBackInternal}
      />
      <StepTransition stepKey={step} direction={direction}>
        {step === "email" && (
          <StepEmail
            defaultEmail={email}
            onSubmit={(value) => {
              setEmail(value);
              goTo("personal");
            }}
          />
        )}
        {step === "personal" && (
          <StepPersonal
            email={email}
            onSuccess={() => goTo("confirm-email")}
            onEmailConflict={() => goTo("email", "backward")}
          />
        )}
        {step === "confirm-email" && <StepConfirmEmail email={email} />}
      </StepTransition>
    </AuthShell>
  );
}