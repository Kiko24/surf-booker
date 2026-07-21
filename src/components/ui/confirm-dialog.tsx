"use client";

import type { ReactNode } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  icon?: ReactNode;
  error?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  icon,
  error,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center">
        {icon && <div className="mb-4 flex justify-center">{icon}</div>}
        <h3 className="mb-2 font-heading text-xl font-bold text-foreground">
          {title}
        </h3>
        <p className="mb-6 text-sm text-text-secondary">{message}</p>
        {error && (
          <p className="mb-4 text-sm text-error">{error}</p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-[#2A2A2A] py-3 text-sm font-semibold text-foreground"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await onConfirm();
                onClose();
              } catch {
                // error handled by caller
              }
            }}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold ${
              variant === "danger"
                ? "bg-error text-error-foreground"
                : "bg-accent text-primary-foreground"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
