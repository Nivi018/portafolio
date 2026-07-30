import { expect, test } from "@playwright/test";

/**
 * Smoke test: the app boots and the public landing page renders.
 *
 * Real auth flows (magic link, Google) cannot be exercised in headless E2E
 * without OAuth credentials, so deeper flows should be tested against a
 * staging environment. This test ensures the production build is at least
 * bootable end-to-end.
 */
test("landing page renders in English and Spanish", async ({ page }) => {
  await page.goto("/en");
  await expect(page).toHaveTitle(/Tickets App/);
  await expect(
    page.getByRole("heading", { name: /Tickets App/i }),
  ).toBeVisible();

  await page.goto("/es");
  await expect(
    page.getByRole("heading", { name: /Tickets App/i }),
  ).toBeVisible();
});

test("protected /app route redirects to sign-in", async ({ page }) => {
  const response = await page.goto("/en/app/acme-support");
  await expect(page).toHaveURL(/\/sign-in/);
  // Either redirected or 404 — both are acceptable for an unauthenticated user
  expect([200, 302, 307, 404]).toContain(response?.status() ?? 0);
});
