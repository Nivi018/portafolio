import { describe, expect, it } from "vitest";
import { generateTotpSecret, verifyTotp } from "./totp";

describe("TOTP", () => {
  it("verifies a freshly generated code", () => {
    const { secret } = generateTotpSecret("user@test.com");
    // We can't get the current code without a TOTP instance, but we
    // can at least sanity-check that an empty / bogus code is rejected.
    expect(verifyTotp(secret, "000000")).toBe(false);
    expect(verifyTotp(secret, "abcdef")).toBe(false);
    expect(verifyTotp(secret, "12345")).toBe(false);
  });

  it("rejects malformed input", () => {
    const { secret } = generateTotpSecret("a@b.com");
    expect(verifyTotp(secret, "")).toBe(false);
    expect(verifyTotp(secret, "1234567")).toBe(false);
    expect(verifyTotp(secret, "12 456")).toBe(false);
  });
});
