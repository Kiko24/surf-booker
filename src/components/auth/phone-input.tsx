"use client";

import { cn } from "@/lib/utils/cn";

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  dialCode?: string;
};

export function PhoneInput({
  value,
  onChange,
  error,
  label = "Telemóvel",
  dialCode = "+351",
}: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    onChange(digits);
  }

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>

      <div className="flex gap-6">
        <div className="flex h-11 select-none items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm text-foreground">
          {dialCode}
        </div>

        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="Insira o seu telemóvel"
          value={value}
          onChange={handleChange}
          className={cn(
            "h-11 flex-1 rounded-lg border bg-surface px-4 text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background",
            error ? "border-error" : "border-border"
          )}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}