const isDev = process.env.NODE_ENV === "development";

function ts(): string {
  return new Date().toISOString();
}

export const logger = {
  error(tag: string, message: string, error?: unknown) {
    if (isDev) {
      console.error(`[${ts()}] [ERROR] [${tag}] ${message}`, error ?? "");
    } else {
      console.error(`[${ts()}] [ERROR] [${tag}] ${message}`);
    }
  },
  warn(tag: string, message: string, data?: unknown) {
    if (isDev) {
      console.warn(`[${ts()}] [WARN]  [${tag}] ${message}`, data ?? "");
    } else {
      console.warn(`[${ts()}] [WARN]  [${tag}] ${message}`);
    }
  },
  info(tag: string, message: string, data?: unknown) {
    if (isDev) {
      console.log(`[${ts()}] [INFO]  [${tag}] ${message}`, data ?? "");
    }
  },
};