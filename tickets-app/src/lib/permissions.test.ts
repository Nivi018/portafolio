import { describe, expect, it } from "vitest";
import { can, canViewTicket, isAtLeast } from "./permissions";
import { Role } from "@prisma/client";

describe("isAtLeast", () => {
  it("ADMIN >= all roles", () => {
    expect(isAtLeast(Role.ADMIN, Role.ADMIN)).toBe(true);
    expect(isAtLeast(Role.ADMIN, Role.AGENT)).toBe(true);
    expect(isAtLeast(Role.ADMIN, Role.CUSTOMER)).toBe(true);
  });

  it("AGENT >= AGENT and CUSTOMER, not ADMIN", () => {
    expect(isAtLeast(Role.AGENT, Role.AGENT)).toBe(true);
    expect(isAtLeast(Role.AGENT, Role.CUSTOMER)).toBe(true);
    expect(isAtLeast(Role.AGENT, Role.ADMIN)).toBe(false);
  });

  it("CUSTOMER only >= CUSTOMER", () => {
    expect(isAtLeast(Role.CUSTOMER, Role.CUSTOMER)).toBe(true);
    expect(isAtLeast(Role.CUSTOMER, Role.AGENT)).toBe(false);
    expect(isAtLeast(Role.CUSTOMER, Role.ADMIN)).toBe(false);
  });
});

describe("permission catalog", () => {
  it("manageOrg requires ADMIN", () => {
    expect(can.manageOrg(Role.ADMIN)).toBe(true);
    expect(can.manageOrg(Role.AGENT)).toBe(false);
    expect(can.manageOrg(Role.CUSTOMER)).toBe(false);
  });

  it("viewAllTickets requires AGENT or ADMIN", () => {
    expect(can.viewAllTickets(Role.ADMIN)).toBe(true);
    expect(can.viewAllTickets(Role.AGENT)).toBe(true);
    expect(can.viewAllTickets(Role.CUSTOMER)).toBe(false);
  });

  it("createInternalNotes requires AGENT or ADMIN", () => {
    expect(can.createInternalNotes(Role.ADMIN)).toBe(true);
    expect(can.createInternalNotes(Role.AGENT)).toBe(true);
    expect(can.createInternalNotes(Role.CUSTOMER)).toBe(false);
  });

  it("viewReports is admin-only", () => {
    expect(can.viewReports(Role.ADMIN)).toBe(true);
    expect(can.viewReports(Role.AGENT)).toBe(false);
    expect(can.viewReports(Role.CUSTOMER)).toBe(false);
  });

  it("manageTags is admin-only", () => {
    expect(can.manageTags(Role.ADMIN)).toBe(true);
    expect(can.manageTags(Role.AGENT)).toBe(false);
    expect(can.manageTags(Role.CUSTOMER)).toBe(false);
  });

  it("manageCannedResponses is for staff", () => {
    expect(can.manageCannedResponses(Role.ADMIN)).toBe(true);
    expect(can.manageCannedResponses(Role.AGENT)).toBe(true);
    expect(can.manageCannedResponses(Role.CUSTOMER)).toBe(false);
  });
});

describe("canViewTicket", () => {
  const ticket = {
    customerId: "cust-1",
    assigneeId: "agent-1",
  };

  it("admins and agents can see all tickets", () => {
    expect(canViewTicket(Role.ADMIN, "any-user", ticket)).toBe(true);
    expect(canViewTicket(Role.AGENT, "any-user", ticket)).toBe(true);
  });

  it("customers can see tickets they created", () => {
    expect(canViewTicket(Role.CUSTOMER, "cust-1", ticket)).toBe(true);
  });

  it("customers can see tickets assigned to them", () => {
    expect(canViewTicket(Role.CUSTOMER, "agent-1", ticket)).toBe(true);
  });

  it("customers cannot see other people's tickets", () => {
    expect(canViewTicket(Role.CUSTOMER, "stranger", ticket)).toBe(false);
  });
});
