"use client";

import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { StepTransition } from "@/components/auth/step-transition";
import { StepEmail } from "./steps/step-email";
import { StepPersonal } from "./steps/step-personal";
import { StepConfirmEmail } from "./steps/step-confirm-email";

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

  // Step 1: navegação real → usa backHref (funciona sempre em mobile)
  // Step 2/3: navegação interna → usa onBack
  const isFirstStep = step === "email";

  return (
    <AuthShell
      backHref={isFirstStep ? "/user-flow" : undefined}
      onBack={isFirstStep ? undefined : handleBackInternal}
    >
      <StepTransition stepKey={step} direction={direction}>
        {step === "email" && (
  <StepEmail
    defaultEmail={email}
    onSubmit={(value) => {
      console.log("[Wizard] received email:", value);
      setEmail(value);
      console.log("[Wizard] calling goTo personal");
      goTo("personal");
      console.log("[Wizard] step should be personal now");
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