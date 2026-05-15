"use client";

import { useEffect, useRef, useState } from "react";
import { FREGUESIAS_PT, formatFreguesia, type FreguesiaPT } from "@/lib/data/freguesias-pt";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
};

export function FreguesiaCombobox({
  value,
  onChange,
  error,
  label = "Localização",
  placeholder = "Pesquisa a tua localização",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered: FreguesiaPT[] = query
    ? FREGUESIAS_PT.filter((f) => {
        const q = query.toLowerCase();
        return (
          f.nome.toLowerCase().includes(q) ||
          f.municipio.toLowerCase().includes(q) ||
          f.distrito.toLowerCase().includes(q)
        );
      }).slice(0, 50)
    : FREGUESIAS_PT.slice(0, 50);

  function handleSelect(f: FreguesiaPT) {
    const formatted = formatFreguesia(f);
    onChange(formatted);
    setQuery(formatted);
    setOpen(false);
  }

  return (
    <div className="w-full" ref={wrapperRef}>
      <label className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (e.target.value === "") onChange("");
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={cn(
            "h-11 w-full rounded-lg border bg-surface px-4 text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background",
            error ? "border-error" : "border-border"
          )}
        />

        {open && filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
            {filtered.map((f) => (
              <li
                key={`${f.nome}-${f.municipio}-${f.distrito}`}
                onClick={() => handleSelect(f)}
                className="cursor-pointer px-4 py-2 text-sm text-foreground hover:bg-background"
              >
                <div>{f.nome}</div>
                <div className="text-xs text-text-muted">
                  {f.municipio}, {f.distrito}
                </div>
              </li>
            ))}
          </ul>
        )}

        {open && filtered.length === 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted">
            Nenhuma freguesia encontrada
          </div>
        )}
      </div>

      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}