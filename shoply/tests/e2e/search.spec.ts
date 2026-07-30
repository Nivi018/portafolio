import { test, expect } from "@playwright/test"

test.describe("Search", () => {
  test("search API returns fuzzy results", async ({ request }) => {
    // Test exact match
    const exact = await request.get("/api/search?q=headphones")
    expect(exact.status()).toBe(200)
    const exactData = await exact.json()
    expect(exactData.results.length).toBeGreaterThan(0)
    expect(exactData.results[0].name).toContain("Headphones")
  })

  test("search API handles typos with fuzzy matching", async ({ request }) => {
    // "headfones" (typo) should still find Headphones via fuzzy match
    const typo = await request.get("/api/search?q=headfones")
    expect(typo.status()).toBe(200)
    const typoData = await typo.json()
    expect(typoData.results.length).toBeGreaterThan(0)
  })

  test("search API returns empty for short queries", async ({ request }) => {
    const short = await request.get("/api/search?q=a")
    expect(short.status()).toBe(200)
    const data = await short.json()
    expect(data.results).toEqual([])
  })
})
