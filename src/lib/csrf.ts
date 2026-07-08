import { headers } from "next/headers";

export class CsrfError extends Error {
  constructor() {
    super("CSRF validation failed");
    this.name = "CsrfError";
  }
}

export async function assertValidOrigin(): Promise<void> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const host = headersList.get("host");

  if (!origin) return;

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host;

    if (process.env.NODE_ENV === "development") {
      if (originHost.includes("localhost") || originHost.includes("127.0.0.1")) return;
    }

    if (originHost === host) return;

    const allowed = process.env.ALLOWED_ORIGINS?.split(",") ?? [];
    if (allowed.some((a) => {
      try { return new URL(a.trim()).host === originHost; } catch { return false; }
    })) return;

    throw new CsrfError();
  } catch (err) {
    if (err instanceof CsrfError) throw err;
    if (process.env.NODE_ENV === "production") throw new CsrfError();
  }
}
