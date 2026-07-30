import { test, expect } from "@playwright/test"

test.describe("Security headers", () => {
  test("homepage has security headers", async ({ request }) => {
    const response = await request.get("/")
    expect(response.status()).toBe(200)
    const headers = response.headers()

    expect(headers["x-frame-options"]).toBe("DENY")
    expect(headers["x-content-type-options"]).toBe("nosniff")
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin")
    expect(headers["x-powered-by"]).toBeUndefined()
  })

  test("API has security headers", async ({ request }) => {
    const response = await request.get("/api/search?q=hat")
    const headers = response.headers()
    expect(headers["x-frame-options"]).toBe("DENY")
    expect(headers["x-content-type-options"]).toBe("nosniff")
  })
})
