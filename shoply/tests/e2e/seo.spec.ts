import { test, expect } from "@playwright/test"

test.describe("SEO and metadata", () => {
  test("homepage has proper meta tags", async ({ page }) => {
    await page.goto("/")
    const title = await page.title()
    expect(title).toContain("Shoply")

    // Check OG meta
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveCount(1)
  })

  test("sitemap.xml is accessible", async ({ request }) => {
    const response = await request.get("/sitemap.xml")
    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain("<urlset")
  })

  test("robots.txt is accessible", async ({ request }) => {
    const response = await request.get("/robots.txt")
    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain("User-Agent")
    expect(body).toContain("Sitemap")
  })

  test("product page has JSON-LD structured data", async ({ page }) => {
    await page.goto("/products/classic-cotton-tee")
    // JSON-LD is rendered as a script tag with type="application/ld+json"
    const jsonLd = page.locator('script[type="application/ld+json"]')
    await expect(jsonLd).toHaveCount(1)
    const content = await jsonLd.first().textContent()
    expect(content).toContain("Product")
    expect(content).toContain("Classic Cotton Tee")
  })
})
