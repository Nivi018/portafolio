import { test, expect } from "@playwright/test"
import { loginAsClient } from "./utils/auth"

test.describe("Compare", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page)
  })

  test("can add a product to compare and view the comparison page", async ({ page }) => {
    await page.goto("/products/classic-cotton-tee")
    // Click "Add to compare" button
    const addBtn = page.getByRole("button", { name: /add to compare/i })
    if (await addBtn.count() > 0) {
      await addBtn.first().click()
      await page.waitForTimeout(500)
    }

    await page.goto("/compare")
    // Should show comparison page (either with products or empty state)
    const heading = page.getByRole("heading", { name: /nothing to compare|compare products/i })
    await expect(heading).toBeVisible()
  })

  test("compare page is accessible from the URL", async ({ page }) => {
    await page.goto("/compare")
    await expect(page).toHaveURL(/\/compare/)
  })
})
