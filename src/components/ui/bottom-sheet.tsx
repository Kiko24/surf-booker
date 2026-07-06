"use client";

import { type ReactNode, useEffect } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  showHandle?: boolean;
  variant?: "bottom" | "center";
  children: ReactNode;
  footer?: ReactNode;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  showHandle = true,
  variant = "bottom",
  children,
  footer,
}: BottomSheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const alignClass =
    variant === "center"
      ? "items-center"
      : "items-end md:items-center";

  const containerClass =
    variant === "center"
      ? "w-full max-w-sm rounded-2xl bg-surface p-6"
      : "w-full max-w-md rounded-t-2xl bg-surface p-6 pb-10 md:rounded-2xl md:pb-6";

  return (
    <div
      className={`fixed inset-0 z-50 flex ${alignClass} justify-center bg-black/50`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={containerClass}>
        {showHandle && variant === "bottom" && (
          <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted md:hidden" />
        )}
        {title && (
          <h3 className="mb-6 font-heading text-2xl font-bold text-foreground">
            {title}
          </h3>
        )}
        <div className="space-y-4">{children}</div>
        {footer && <div className="flex gap-3 pt-2">{footer}</div>}
      </div>
    </div>
  );
}
