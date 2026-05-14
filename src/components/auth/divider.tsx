export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-text-secondary text-sm">
      <span className="h-px flex-1 bg-text-muted/40" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-text-muted/40" />
    </div>
  );
}