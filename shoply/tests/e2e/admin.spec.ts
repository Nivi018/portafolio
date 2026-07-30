import { test, expect } from "@playwright/test"
import { loginAsAdmin, logout } from "./utils/auth"

test.describe("Admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("admin dashboard shows metrics", async ({ page }) => {
    await page.goto("/admin")
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible()
    // Wait for stats cards
    await expect(page.getByText(/Total revenue/i)).toBeVisible()
  })

  test("admin orders page lists orders", async ({ page }) => {
    await page.goto("/admin/orders")
    await expect(page.getByRole("heading", { name: /Orders/i })).toBeVisible()
  })

  test("can view order detail", async ({ page }) => {
    await page.goto("/admin/orders")
    // Click first order link
    const firstOrder = page.locator("a[href^='/admin/orders/']").first()
    const href = await firstOrder.getAttribute("href")
    if (href && href !== "/admin/orders") {
      await firstOrder.click()
      await expect(page.getByText(/Customer/i)).toBeVisible()
      await expect(page.getByText(/Items/i).first()).toBeVisible()
    }
  })

  test("admin products page", async ({ page }) => {
    await page.goto("/admin/products")
    await expect(page.getByRole("heading", { name: /Products/i })).toBeVisible()
  })

  test("can navigate to new product form", async ({ page }) => {
    await page.goto("/admin/products/new")
    await expect(page.getByRole("heading", { name: /New product/i })).toBeVisible()
    await expect(page.getByLabel(/Name/i)).toBeVisible()
  })

  test("admin categories page", async ({ page }) => {
    await page.goto("/admin/categories")
    await expect(page.getByRole("heading", { name: /Categories/i })).toBeVisible()
  })

  test("admin coupons page", async ({ page }) => {
    await page.goto("/admin/coupons")
    await expect(page.getByRole("heading", { name: /Coupons/i })).toBeVisible()
  })

  test("admin users page", async ({ page }) => {
    await page.goto("/admin/users")
    await expect(page.getByRole("heading", { name: /Users/i })).toBeVisible()
  })

  test("non-admin cannot access admin", async ({ page, context }) => {
    // Clear cookies to log out admin
    await context.clearCookies()
    // Login as client
    await page.goto("/login")
    await page.getByRole("textbox", { name: "Email", exact: true }).fill("client@shoply.dev")
    await page.getByLabel("Password", { exact: true }).fill("client123")
    await page.getByRole("button", { name: /sign in/i }).click()
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 10_000 })

    // Try to access admin
    await page.goto("/admin")
    // Should redirect away from /admin (to /)
    await page.waitForURL((url) => !url.pathname.startsWith("/admin"), { timeout: 10_000 })
    expect(page.url()).not.toContain("/admin")
  })
})
