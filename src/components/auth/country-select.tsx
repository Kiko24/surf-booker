"use client";

import { SUPPORTED_COUNTRIES, type CountryCode } from "@/lib/validation/signup-owner";

type Props = {
  value: CountryCode;
  onChange: (code: CountryCode) => void;
  label?: string;
};

export function CountrySelect({ value, onChange, label = "País" }: Props) {
  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as CountryCode)}
          disabled={SUPPORTED_COUNTRIES.length <= 1}
          className="h-11 w-full appearance-none rounded-lg border border-border bg-surface px-4 pr-20 text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed"
        >
          {SUPPORTED_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-text-muted">
          {SUPPORTED_COUNTRIES.length <= 1 ? "Editar" : "▾"}
        </span>
      </div>
    </div>
  );
}