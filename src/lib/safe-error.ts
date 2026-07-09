import { logger } from "./logger";

const isDev = process.env.NODE_ENV === "development";

export function safeError(error: unknown, fallback = "Ocorreu um erro inesperado"): string {
  const message = error instanceof Error ? error.message : String(error);
  logger.error("safeError", message, error);
  if (isDev) return message;
  return fallback;
}
