import { expect, test } from "@playwright/test";

/**
 * Authenticated E2E using the test-only /api/test/auth bypass.
 * Only runs when E2E_AUTH_BYPASS=1 (set automatically in CI / dev).
 */
test.describe("Authenticated flows", () => {
  test("admin can view org dashboard and tickets", async ({
    page,
    request,
  }) => {
    const res = await request.post("/api/test/auth", {
      data: { email: "admin@acme.test" },
    });
    expect(res.ok()).toBeTruthy();
    const { cookieName, cookieValue } = (await res.json()) as {
      cookieName: string;
      cookieValue: string;
    };
    await page.context().addCookies([
      {
        name: cookieName,
        value: cookieValue,
        url: "http://localhost:3000",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/en/app/acme-support");
    await expect(
      page.getByRole("heading", { name: /Dashboard/i }),
    ).toBeVisible();

    await page.goto("/en/app/acme-support/tickets");
    await expect(page.getByRole("link", { name: /New ticket/i })).toBeVisible();
  });

  test("customer cannot access members page", async ({ page, request }) => {
    const res = await request.post("/api/test/auth", {
      data: { email: "customer1@acme.test" },
    });
    const { cookieName, cookieValue } = (await res.json()) as {
      cookieName: string;
      cookieValue: string;
    };
    await page.context().addCookies([
      {
        name: cookieName,
        value: cookieValue,
        url: "http://localhost:3000",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/en/app/acme-support/settings/members");
    // Either redirected or 404 — never the members list
    await expect(page).not.toHaveURL(/\/settings\/members$/);
  });
});
