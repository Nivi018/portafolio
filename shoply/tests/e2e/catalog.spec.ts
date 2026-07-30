import { test, expect } from "@playwright/test"

test.describe("Catalog", () => {
  test("products page lists products", async ({ page }) => {
    await page.goto("/products")
    await expect(page.getByRole("heading", { name: /All products/i })).toBeVisible()
    // Wait for products to load (look for a product card link)
    await expect(page.locator("a[href^='/products/']").first()).toBeVisible()
  })

  test("can navigate to a product detail page", async ({ page }) => {
    await page.goto("/products")
    const firstProduct = page.locator("a[href^='/products/']").first()
    const href = await firstProduct.getAttribute("href")
    expect(href).toBeTruthy()
    await firstProduct.click()
    await expect(page).toHaveURL(/\/products\//)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("product detail shows price and add to cart", async ({ page }) => {
    await page.goto("/products/classic-cotton-tee")
    await expect(page.getByText(/29.99/)).toBeVisible()
    await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible()
  })

  test("search API returns results", async ({ request }) => {
    const response = await request.get("/api/search?q=headphones")
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.results.length).toBeGreaterThan(0)
    expect(data.results[0].name).toContain("Headphones")
  })

  test("categories page shows categories", async ({ page }) => {
    await page.goto("/categories")
    await expect(page.getByRole("heading", { name: /All categories/i })).toBeVisible()
  })
})
