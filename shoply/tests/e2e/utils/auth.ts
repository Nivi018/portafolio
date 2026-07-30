import type { Page } from "@playwright/test"

export const CLIENT = {
  email: "client@shoply.dev",
  password: "client123",
}

export const ADMIN = {
  email: "admin@shoply.dev",
  password: "admin123",
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  // Use exact match to avoid footer newsletter form conflict
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: /sign in/i }).click()
  // Wait for redirect away from /login
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 })
}

export async function loginAsClient(page: Page) {
  await login(page, CLIENT.email, CLIENT.password)
}

export async function loginAsAdmin(page: Page) {
  await login(page, ADMIN.email, ADMIN.password)
}

export async function logout(page: Page) {
  // Click user menu and sign out
  await page.getByRole("button", { name: "User menu" }).click()
  await page.getByRole("menuitem", { name: /sign out/i }).click()
  await page.waitForLoadState("networkidle")
}
