import { describe, it, expect } from "vitest"
import { computeCartTotals, type CartItemInput } from "@/lib/pricing"

describe("computeCartTotals", () => {
  it("returns zeros for empty cart", () => {
    const totals = computeCartTotals([])
    expect(totals).toEqual({
      subtotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      itemCount: 0,
    })
  })

  it("calculates subtotal and item count correctly", () => {
    const items: CartItemInput[] = [
      { price: 25, quantity: 2 },
      { price: 15.5, quantity: 3 },
    ]
    const totals = computeCartTotals(items)
    expect(totals.subtotal).toBe(96.5) // 25*2 + 15.5*3 = 50 + 46.5
    expect(totals.itemCount).toBe(5)
    expect(totals.shipping).toBe(0) // free shipping over $50
    expect(totals.total).toBe(96.5)
  })

  it("charges standard shipping for orders under $50", () => {
    const items: CartItemInput[] = [{ price: 20, quantity: 1 }]
    const totals = computeCartTotals(items)
    expect(totals.subtotal).toBe(20)
    expect(totals.shipping).toBe(5)
    expect(totals.total).toBe(25)
  })

  it("applies percent discount", () => {
    const items: CartItemInput[] = [{ price: 100, quantity: 1 }]
    const totals = computeCartTotals(items, { type: "PERCENT", value: 10 })
    expect(totals.subtotal).toBe(100)
    expect(totals.discount).toBe(10)
    expect(totals.shipping).toBe(0) // free after discount? actually subtotal is checked
    expect(totals.total).toBe(90)
  })

  it("applies fixed discount and caps at subtotal", () => {
    const items: CartItemInput[] = [{ price: 50, quantity: 1 }]
    const totals = computeCartTotals(items, { type: "FIXED", value: 100 })
    expect(totals.discount).toBe(50) // capped at subtotal
    expect(totals.total).toBe(0)
  })

  it("rounds to 2 decimal places", () => {
    const items: CartItemInput[] = [{ price: 9.999, quantity: 1 }]
    const totals = computeCartTotals(items)
    expect(totals.subtotal).toBe(10) // rounded from 9.999
  })
})
