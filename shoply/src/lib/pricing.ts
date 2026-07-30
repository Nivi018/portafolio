export type CartTotals = {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  itemCount: number
}

export type CartItemInput = {
  price: number
  quantity: number
}

const FREE_SHIPPING_THRESHOLD = 50
const STANDARD_SHIPPING = 5
const TAX_RATE = 0.0 // 0% for now; can be configured per-region

export function computeCartTotals(
  items: CartItemInput[],
  coupon?: { type: "PERCENT" | "FIXED"; value: number } | null,
): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  let discount = 0
  if (coupon) {
    if (coupon.type === "PERCENT") {
      discount = (subtotal * coupon.value) / 100
    } else {
      discount = Math.min(coupon.value, subtotal)
    }
  }

  const shipping = subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING

  const taxBase = subtotal - discount
  const tax = taxBase * TAX_RATE

  const total = Math.max(0, taxBase + shipping + tax)

  return {
    subtotal: round(subtotal),
    discount: round(discount),
    shipping: round(shipping),
    tax: round(tax),
    total: round(total),
    itemCount,
  }
}

function round(n: number) {
  return Math.round(n * 100) / 100
}
