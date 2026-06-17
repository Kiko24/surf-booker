import { describe, it, expect } from "vitest";
import { formatTimeAgo } from "../format";

describe("formatTimeAgo", () => {
  it('returns "agora" for less than 1 minute', () => {
    expect(formatTimeAgo(new Date())).toBe("agora");
  });

  it('returns "há X min" for minutes', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatTimeAgo(d)).toBe("há 5 min");
  });

  it('returns "há X horas" for hours', () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatTimeAgo(d)).toBe("há 3 horas");
  });

  it('returns "há X dias" for days', () => {
    const d = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatTimeAgo(d)).toBe("há 2 dias");
  });

  it('uses singular for 1 hour', () => {
    const d = new Date(Date.now() - 60 * 60 * 1000);
    expect(formatTimeAgo(d)).toBe("há 1 hora");
  });

  it('uses singular for 1 day', () => {
    const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(formatTimeAgo(d)).toBe("há 1 dia");
  });
});
