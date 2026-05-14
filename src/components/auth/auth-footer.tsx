type AuthFooterProps = {
  variant?: "default" | "inline";
};

export function AuthFooter({ variant = "default" }: AuthFooterProps) {
  return (
    <footer
      className={
        variant === "inline"
          ? "flex items-center justify-center gap-3 text-sm text-accent"
          : "flex items-center justify-center gap-3 py-6 text-sm text-accent"
      }
    >
      <button
        type="button"
        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
      >
        <span>Português (PT)</span>
        <span aria-hidden>🌐</span>
      </button>
      <span aria-hidden className="text-text-muted">|</span>
      <button
        type="button"
        className="hover:opacity-80 transition-opacity"
      >
        Precisa de ajuda?
      </button>
    </footer>
  );
}