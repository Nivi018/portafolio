import { describe, it, expect, vi, beforeEach } from "vitest"
import { appUrl } from "@/lib/email"

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "test-id" }, error: null }),
    },
  })),
}))

describe("Email Utils", () => {
  describe("appUrl", () => {
    it("exports app URL", () => {
      expect(appUrl).toBeDefined()
      expect(typeof appUrl).toBe("string")
    })
  })
})
