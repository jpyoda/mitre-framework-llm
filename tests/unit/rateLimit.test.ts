import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/scenario/rateLimit";

const HOUR = 60 * 60 * 1000;

describe("checkRateLimit", () => {
  it("allows up to the limit, then refuses with a retry time", () => {
    const now = 1_000_000;
    expect(checkRateLimit("a", 2, HOUR, now).allowed).toBe(true);
    expect(checkRateLimit("a", 2, HOUR, now + 1).allowed).toBe(true);
    const third = checkRateLimit("a", 2, HOUR, now + 1000);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBe(HOUR / 1000 - 1);
  });

  it("starts a new window once the old one expires", () => {
    const now = 5_000_000;
    checkRateLimit("b", 1, HOUR, now);
    expect(checkRateLimit("b", 1, HOUR, now + 10).allowed).toBe(false);
    expect(checkRateLimit("b", 1, HOUR, now + HOUR).allowed).toBe(true);
  });

  it("counts each key separately", () => {
    checkRateLimit("c", 1, HOUR, 0);
    expect(checkRateLimit("d", 1, HOUR, 0).allowed).toBe(true);
  });

  it("is off when the limit is 0", () => {
    for (let i = 0; i < 5; i++) expect(checkRateLimit("e", 0, HOUR).allowed).toBe(true);
  });
});
