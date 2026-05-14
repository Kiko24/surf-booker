export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove caracteres especiais
    .replace(/\s+/g, "-") // espaços → hífens
    .replace(/-+/g, "-") // múltiplos hífens → 1
    .replace(/^-+|-+$/g, "") // remove hífens das pontas
    .slice(0, 60); // max 60 chars (constraint da DB)
}