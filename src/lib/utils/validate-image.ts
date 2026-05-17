export type ImageMimeType = "image/png" | "image/jpeg" | "image/webp";

/**
 * Valida que o ficheiro é realmente uma imagem PNG/JPEG/WEBP
 * lendo os magic bytes (primeiros bytes do ficheiro).
 *
 * Não confiar no MIME type vindo do browser nem na extensão.
 */
export async function validateImageContent(
  file: File
): Promise<{ ok: true; mime: ImageMimeType } | { ok: false; reason: string }> {
  if (file.size === 0) {
    return { ok: false, reason: "Ficheiro vazio" };
  }

  // Lê os primeiros 12 bytes (suficiente para PNG/JPEG/WEBP)
  // NOTA: file.slice().arrayBuffer() pode falhar em runtime Node.js;
  // lemos o arrayBuffer inteiro e fazemos slice manual.
  const full = await file.arrayBuffer();
  const bytes = new Uint8Array(full.slice(0, 12));

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { ok: true, mime: "image/png" };
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ok: true, mime: "image/jpeg" };
  }

  // WEBP: 52 49 46 46 [4 bytes size] 57 45 42 50
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { ok: true, mime: "image/webp" };
  }

  return {
    ok: false,
    reason: "Ficheiro não é uma imagem válida (PNG, JPEG ou WEBP)",
  };
}