import { describe, expect, it } from "vitest";
import { Priority } from "@prisma/client";
import { createTicketSchema } from "./ticket";

describe("createTicketSchema", () => {
  it("accepts a valid ticket", () => {
    const result = createTicketSchema.safeParse({
      subject: "Login broken",
      description: "I cannot log in to my account since this morning.",
      priority: Priority.HIGH,
    });
    expect(result.success).toBe(true);
  });

  it("rejects short subject", () => {
    const result = createTicketSchema.safeParse({
      subject: "ab",
      description: "A valid description here that is long enough.",
      priority: Priority.MEDIUM,
    });
    expect(result.success).toBe(false);
  });

  it("rejects long subject", () => {
    const result = createTicketSchema.safeParse({
      subject: "a".repeat(201),
      description: "A valid description here.",
      priority: Priority.MEDIUM,
    });
    expect(result.success).toBe(false);
  });

  it("rejects short description", () => {
    const result = createTicketSchema.safeParse({
      subject: "Valid subject",
      description: "short",
      priority: Priority.MEDIUM,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = createTicketSchema.safeParse({
      subject: "Valid subject",
      description: "A valid description here.",
      priority: "SUPER_URGENT",
    });
    expect(result.success).toBe(false);
  });
});
