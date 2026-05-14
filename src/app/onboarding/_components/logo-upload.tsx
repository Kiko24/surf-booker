"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type Props = {
  onChange: (file: File | null) => void;
  error?: string;
  label?: string;
};

export function LogoUploader({ onChange, error, label = "Logo" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      setPreview(null);
      onChange(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file);
  }

  function handleRemove() {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-foreground">
  {label} <span className="text-text-muted">(opcional)</span>
</label>

      <div className="flex flex-col items-center gap-3">
        <button
  type="button"
  onClick={() => inputRef.current?.click()}
  className={cn(
    "flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed bg-surface transition-colors hover:bg-background",
    error ? "border-error" : "border-border"
  )}
>
  {preview ? (
    <Image
      src={preview}
      alt="Preview do logo"
      width={80}
      height={80}
      className="h-20 w-20 rounded-full object-cover"
    />
  ) : (
    <span className="text-2xl text-accent">+</span>
  )}
</button>

        {preview ? (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-text-secondary hover:text-error"
          >
            Remover imagem
          </button>
        ) : (
          <span className="text-sm text-text-muted">Adicionar Logo</span>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <p className="mt-1.5 text-center text-xs text-error">{error}</p>
      )}
    </div>
  );
}