const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.warn("TURNSTILE_SECRET_KEY not set — skipping verification");
    return true;
  }

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = (await res.json()) as { success: boolean };
    return data.success;
  } catch {
    return false;
  }
}