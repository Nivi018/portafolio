import { describe, expect, it } from "vitest";
import { isValidSlug, slugify } from "./slug";

describe("slugify", () => {
  it("lowercases input", () => {
    expect(slugify("HELLO World")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world");
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("removes accents", () => {
    expect(slugify("José Pérez")).toBe("jose-perez");
    expect(slugify("Árbol Niño")).toBe("arbol-nino");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world");
    expect(slugify("foo@bar.com")).toBe("foobarcom");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("hello---world")).toBe("hello-world");
    expect(slugify("hello - world")).toBe("hello-world");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("---hello---")).toBe("hello");
    expect(slugify(" hello ")).toBe("hello");
  });

  it("returns empty string for input that produces nothing", () => {
    expect(slugify("---")).toBe("");
    expect(slugify("!!!")).toBe("");
  });

  it("preserves numbers", () => {
    expect(slugify("Tickets 2024")).toBe("tickets-2024");
  });
});

describe("isValidSlug", () => {
  it("accepts valid slugs", () => {
    expect(isValidSlug("acme")).toBe(true);
    expect(isValidSlug("acme-support")).toBe(true);
    expect(isValidSlug("a1b2c3")).toBe(true);
    expect(isValidSlug("123-abc")).toBe(true);
  });

  it("rejects slugs with uppercase", () => {
    expect(isValidSlug("Acme")).toBe(false);
    expect(isValidSlug("ACME-SUPPORT")).toBe(false);
  });

  it("rejects slugs with special characters", () => {
    expect(isValidSlug("acme_support")).toBe(false);
    expect(isValidSlug("acme.support")).toBe(false);
    expect(isValidSlug("acme/support")).toBe(false);
  });

  it("rejects slugs that are too short or too long", () => {
    expect(isValidSlug("a")).toBe(false);
    expect(isValidSlug("a".repeat(41))).toBe(false);
  });

  it("rejects slugs starting or ending with hyphens", () => {
    expect(isValidSlug("-acme")).toBe(false);
    expect(isValidSlug("acme-")).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(isValidSlug("")).toBe(false);
  });

  it("rejects slugs with consecutive hyphens", () => {
    expect(isValidSlug("acme--support")).toBe(false);
  });
});
