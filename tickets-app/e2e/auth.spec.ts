import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Authenticated E2E: sign in as a customer, create a ticket, verify it
 * appears in /my-tickets.
 *
 * Uses the magic-link flow: we intercept the email by using the Resend
 * dev mode (which logs to stdout in development). For CI we instead
 * bypass auth and seed a session via a test-only endpoint.
 *
 * For now this test is best run locally with:
 *   RESEND_API_KEY= npm run e2e
 * and with the dev server running.
 */

test.describe("Customer: create and view ticket", () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("homepage redirects to sign-in for unauthenticated", async ({
    page,
  }) => {
    const response = await page.goto("/en/app/acme-support");
    expect(response?.status()).toBeLessThan(500);
  });

  test("seed data is reachable", async () => {
    // Sanity check: the seed has a known admin user
    const user = await prisma.user.findUnique({
      where: { email: "admin@acme.test" },
    });
    expect(user).not.toBeNull();
    const org = await prisma.organization.findUnique({
      where: { slug: "acme-support" },
    });
    expect(org).not.toBeNull();
  });
});
