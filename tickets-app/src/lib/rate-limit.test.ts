import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    // Each test uses a unique key (set per-test), so no reset needed.
  });

  it("allows the first N events within the window", () => {
    const result = rateLimit("test:1", { limit: 3, windowMs: 1000 });
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(2);

    expect(rateLimit("test:1", { limit: 3, windowMs: 1000 }).ok).toBe(true);
    expect(rateLimit("test:1", { limit: 3, windowMs: 1000 }).ok).toBe(true);
    expect(rateLimit("test:1", { limit: 3, windowMs: 1000 }).ok).toBe(false);
  });

  it("reports the right remaining count", () => {
    const r1 = rateLimit("test:2", { limit: 5, windowMs: 1000 });
    expect(r1.remaining).toBe(4);

    const r2 = rateLimit("test:2", { limit: 5, windowMs: 1000 });
    expect(r2.remaining).toBe(3);
  });

  it("rejects when over the limit with resetInMs > 0", () => {
    const r = rateLimit("test:3", { limit: 1, windowMs: 10_000 });
    expect(r.ok).toBe(true);

    const blocked = rateLimit("test:3", { limit: 1, windowMs: 10_000 });
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInMs).toBeGreaterThan(0);
  });

  it("isolates buckets per key", () => {
    rateLimit("user-a", { limit: 1, windowMs: 1000 });
    const a = rateLimit("user-a", { limit: 1, windowMs: 1000 });
    const b = rateLimit("user-b", { limit: 1, windowMs: 1000 });
    expect(a.ok).toBe(false);
    expect(b.ok).toBe(true);
  });

  it("resets the bucket after the window elapses", async () => {
    const r = rateLimit("test:reset", { limit: 1, windowMs: 50 });
    expect(r.ok).toBe(true);

    const blocked = rateLimit("test:reset", { limit: 1, windowMs: 50 });
    expect(blocked.ok).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 70));

    const afterReset = rateLimit("test:reset", {
      limit: 1,
      windowMs: 50,
    });
    expect(afterReset.ok).toBe(true);
  });
});
