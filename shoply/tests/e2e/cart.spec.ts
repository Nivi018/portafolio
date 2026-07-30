import { test, expect } from "@playwright/test"
import { loginAsClient, logout } from "./utils/auth"

async function addToCart(page: import("@playwright/test").Page, slug: string) {
  await page.goto(`/products/${slug}`)
  await page.getByRole("button", { name: /add to cart/i }).click()
  await expect(page.getByText(/Added.*to cart/i)).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(500)
}

test.describe("Cart", () => {
  test("can add product to cart from product page", async ({ page }) => {
    await loginAsClient(page)
    await addToCart(page, "classic-cotton-tee")
  })

  test("cart page is accessible and shows summary", async ({ page }) => {
    await loginAsClient(page)
    await addToCart(page, "ceramic-coffee-mug")
    await page.goto("/cart")
    await expect(page.getByText(/Order summary/i)).toBeVisible()
  })

  test("invalid coupon shows error", async ({ page }) => {
    await loginAsClient(page)
    await addToCart(page, "ceramic-coffee-mug")
    await page.goto("/cart")
    // If coupon is already applied, remove it first
    const removeCoupon = page.getByRole("button", { name: /remove coupon/i })
    if ((await removeCoupon.count()) > 0) {
      await removeCoupon.first().click()
      await page.waitForTimeout(800)
    }
    // Now there should be a promo code input
    const promoInput = page.getByPlaceholder(/promo code/i)
    if ((await promoInput.count()) > 0) {
      await promoInput.fill("INVALIDCODE")
      await page.getByRole("button", { name: /apply/i }).click()
      await expect(page.getByText(/Invalid coupon/i)).toBeVisible({ timeout: 10_000 })
    }
  })
})
