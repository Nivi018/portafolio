import { test, expect } from "@playwright/test"
import { loginAsClient } from "./utils/auth"

test.describe("Authentication", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/Shoply/)
    await expect(page.getByRole("heading", { name: /Curated essentials/i })).toBeVisible()
  })

  test("login page renders", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Email", exact: true })).toBeVisible()
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible()
  })

  test("can register a new account", async ({ page }) => {
    const email = `test-${Date.now()}@example.com`
    await page.goto("/register")
    await page.getByLabel("Full name").fill("Test User")
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email)
    await page.getByLabel("Password", { exact: true }).fill("password123")
    await page.getByRole("button", { name: /create account/i }).click()
    // Should redirect to home or account
    await page.waitForURL((url) => !url.pathname.includes("/register"), { timeout: 15_000 })
  })

  test("can log in with demo client credentials", async ({ page }) => {
    await loginAsClient(page)
    // Should now be on home page
    await expect(page).toHaveURL("/")
    // User menu should be visible
    await expect(page.getByRole("button", { name: "User menu" })).toBeVisible()
  })

  test("login shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("textbox", { name: "Email", exact: true }).fill("wrong@example.com")
    await page.getByLabel("Password", { exact: true }).fill("wrongpassword")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible({ timeout: 10_000 })
  })

  test("redirects unauthenticated user to login from /account", async ({ page }) => {
    await page.goto("/account")
    await expect(page).toHaveURL(/\/login/)
  })
})
