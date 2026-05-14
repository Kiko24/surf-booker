"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import googleImg from "@/components/images/google.png";
import facebookImg from "@/components/images/facebook.png";
import appleImg from "@/components/images/apple-logo.png";

type Provider = "google" | "facebook" | "apple";

const labels: Record<Provider, string> = {
  google: "Continuar usando o Google",
  facebook: "Continuar usando o Facebook",
  apple: "Continuar usando a Apple",
};

const icons: Record<Provider, typeof googleImg> = {
  google: googleImg,
  facebook: facebookImg,
  apple: appleImg,
};

export function SocialButtons({
  onProviderClick,
}: {
  onProviderClick?: (p: Provider) => void;
}) {
  const providers: Provider[] = ["google", "facebook", "apple"];

  return (
    <div className="flex flex-col gap-6">
      {providers.map((p) => (
        <Button
          key={p}
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => onProviderClick?.(p)}
          className="!justify-center gap-3"
        >
          <Image
            src={icons[p]}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
          <span>{labels[p]}</span>
        </Button>
      ))}
    </div>
  );
}