import { describe, expect, it } from "vitest";
import { Role, Status } from "@prisma/client";
import {
  canChangeStatus,
  canManageTicket,
  canTransition,
  requiresReason,
} from "./ticket-workflow";

describe("canTransition", () => {
  it("allows the forward flow from OPEN", () => {
    expect(canTransition(Status.OPEN, Status.IN_PROGRESS)).toBe(true);
    expect(canTransition(Status.OPEN, Status.WAITING_CUSTOMER)).toBe(true);
    expect(canTransition(Status.OPEN, Status.RESOLVED)).toBe(true);
    expect(canTransition(Status.OPEN, Status.CLOSED)).toBe(true);
  });

  it("allows the forward flow from IN_PROGRESS", () => {
    expect(canTransition(Status.IN_PROGRESS, Status.WAITING_CUSTOMER)).toBe(
      true,
    );
    expect(canTransition(Status.IN_PROGRESS, Status.RESOLVED)).toBe(true);
    expect(canTransition(Status.IN_PROGRESS, Status.CLOSED)).toBe(true);
  });

  it("allows WAITING_CUSTOMER to go back to IN_PROGRESS", () => {
    expect(canTransition(Status.WAITING_CUSTOMER, Status.IN_PROGRESS)).toBe(
      true,
    );
    expect(canTransition(Status.WAITING_CUSTOMER, Status.RESOLVED)).toBe(true);
    expect(canTransition(Status.WAITING_CUSTOMER, Status.CLOSED)).toBe(true);
  });

  it("allows RESOLVED to go to CLOSED or back to OPEN", () => {
    expect(canTransition(Status.RESOLVED, Status.CLOSED)).toBe(true);
    expect(canTransition(Status.RESOLVED, Status.OPEN)).toBe(true);
    // Cannot skip to IN_PROGRESS
    expect(canTransition(Status.RESOLVED, Status.IN_PROGRESS)).toBe(false);
    // Cannot skip to WAITING_CUSTOMER
    expect(canTransition(Status.RESOLVED, Status.WAITING_CUSTOMER)).toBe(false);
  });

  it("allows CLOSED to go back to OPEN only (reopen)", () => {
    expect(canTransition(Status.CLOSED, Status.OPEN)).toBe(true);
    expect(canTransition(Status.CLOSED, Status.RESOLVED)).toBe(false);
    expect(canTransition(Status.CLOSED, Status.IN_PROGRESS)).toBe(false);
  });

  it("rejects same-state transitions", () => {
    for (const s of Object.values(Status)) {
      expect(canTransition(s, s)).toBe(false);
    }
  });

  it("rejects skipping steps forward", () => {
    expect(canTransition(Status.OPEN, Status.RESOLVED)).toBe(true); // OK, customer resolved directly
    expect(canTransition(Status.OPEN, Status.WAITING_CUSTOMER)).toBe(true); // OK, waiting from start
  });
});

describe("requiresReason", () => {
  it("is true for reopen from CLOSED", () => {
    expect(requiresReason(Status.CLOSED, Status.OPEN)).toBe(true);
  });

  it("is true for reopen from RESOLVED", () => {
    expect(requiresReason(Status.RESOLVED, Status.OPEN)).toBe(true);
  });

  it("is false for other transitions", () => {
    expect(requiresReason(Status.OPEN, Status.IN_PROGRESS)).toBe(false);
    expect(requiresReason(Status.RESOLVED, Status.CLOSED)).toBe(false);
    expect(requiresReason(Status.OPEN, Status.OPEN)).toBe(false);
  });
});

describe("canChangeStatus", () => {
  it("admin and agent can change status of any ticket", () => {
    expect(canChangeStatus(Role.ADMIN, false)).toBe(true);
    expect(canChangeStatus(Role.AGENT, false)).toBe(true);
    expect(canChangeStatus(Role.ADMIN, true)).toBe(true);
    expect(canChangeStatus(Role.AGENT, true)).toBe(true);
  });

  it("customer can change status only of their own ticket", () => {
    expect(canChangeStatus(Role.CUSTOMER, true)).toBe(true);
    expect(canChangeStatus(Role.CUSTOMER, false)).toBe(false);
  });
});

describe("canManageTicket", () => {
  it("only AGENT and ADMIN can change priority/assignee", () => {
    expect(canManageTicket(Role.ADMIN)).toBe(true);
    expect(canManageTicket(Role.AGENT)).toBe(true);
    expect(canManageTicket(Role.CUSTOMER)).toBe(false);
  });
});
