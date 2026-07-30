import { describe, it, expect, vi } from "vitest"

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

describe("sentry module loads without errors", () => {
  it("imports helpers successfully", async () => {
    const sentry = await import("../../sentry.client.config")
    expect(sentry.captureException).toBeDefined()
    expect(sentry.captureMessage).toBeDefined()
  })

  it("captureException is callable", async () => {
    const { captureException } = await import("../../sentry.client.config")
    expect(() => captureException(new Error("test"))).not.toThrow()
  })

  it("captureMessage is callable", async () => {
    const { captureMessage } = await import("../../sentry.client.config")
    expect(() => captureMessage("test message", "info")).not.toThrow()
  })
})
