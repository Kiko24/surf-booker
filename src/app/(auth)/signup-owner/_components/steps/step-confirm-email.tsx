"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { resendConfirmationEmail } from "../../actions";
import { cn } from "@/lib/utils/cn";
import gmailImg from "@/components/images/gmail.png";

type Props = {
  email: string;
};

const RESEND_COOLDOWN_SECONDS = 60;

export function StepConfirmEmail({ email }: Props) {
  const [pending, startTransition] = useTransition();
  const [cooldown, setCooldown] = useState(0);
  const [feedback, setFeedback] = useState<
    { type: "success" | "error"; message: string } | undefined
  >();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function handleOpenEmail() {
    const domain = email.split("@")[1]?.toLowerCase();

    const knownProviders: Record<string, string> = {
      "gmail.com": "https://mail.google.com",
      "googlemail.com": "https://mail.google.com",
      "outlook.com": "https://outlook.live.com",
      "hotmail.com": "https://outlook.live.com",
      "live.com": "https://outlook.live.com",
      "yahoo.com": "https://mail.yahoo.com",
      "icloud.com": "https://www.icloud.com/mail",
    };

    const url = domain && knownProviders[domain];

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  function handleResend() {
    setFeedback(undefined);

    startTransition(async () => {
      const result = await resendConfirmationEmail(email);

      if (result.ok) {
        setFeedback({
          type: "success",
          message: "Email reenviado com sucesso.",
        });
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setFeedback({
          type: "error",
          message: result.error,
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 text-center">

      <Image
        src={gmailImg}
        alt=""
        width={48}
        height={48}
        className="mx-auto h-12 w-12 object-contain"
      />

      <p className="text-sm text-text-secondary">
        Obrigado pelo teu registo!
        <br />
        Confirma o teu email para segurança máxima.
      </p>

      {/* AQUI: Mudei de gap-3 para gap-6 para igualar o espaçamento de cima */}
      <div className="flex flex-col gap-6">
        <Button
          type="button"
          fullWidth
          onClick={handleOpenEmail}
          className="text-base font-semibold"
        >
          Abre o email
        </Button>

        <button
          type="button"
          onClick={handleResend}
          disabled={pending || cooldown > 0}
          className="text-sm text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
        >
          {cooldown > 0
            ? `Reenviar email (${cooldown}s)`
            : pending
              ? "A reenviar..."
              : "Não recebeste? Reenviar email"}
        </button>

        {feedback && (
          <p
            className={cn(
              "text-xs -mt-2", // O -mt-2 aproxima a mensagem de erro/sucesso do botão Reenviar
              feedback.type === "success" ? "text-success" : "text-error"
            )}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </div>
  );
}