"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  AddressElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { Loader2, Lock, Truck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { createCheckoutAction } from "@/server/actions/orders"
import { cn } from "@/lib/utils"

type Address = {
  id: string
  fullName: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  isDefault: boolean
}

type Item = {
  productId: string
  productName: string
  variantName: string | null
  quantity: number
  price: number
  image?: string
}

type Props = {
  addresses: Address[]
  items: Item[]
  totals: {
    subtotal: number
    discount: number
    shipping: number
    tax: number
    total: number
  }
  appliedCoupon: { code: string; type: "PERCENT" | "FIXED"; value: number } | null
}

export function CheckoutForm({ addresses, items, totals, appliedCoupon }: Props) {
  const [step, setStep] = useState<"details" | "payment">(addresses.length > 0 ? "details" : "details")
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "new",
  )
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  })
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard")
  const [isCreating, startCreate] = useTransition()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [publishableKey, setPublishableKey] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const finalShipping =
    totals.subtotal === 0 ? 0 : shippingMethod === "express" ? 15 : totals.shipping
  const finalTotal = totals.subtotal - totals.discount + finalShipping

  function handleContinue() {
    setError(null)
    startCreate(async () => {
      const result = await createCheckoutAction({
        addressId: selectedAddressId === "new" ? undefined : selectedAddressId,
        newAddress: selectedAddressId === "new" ? newAddress : undefined,
        shippingMethod,
      })
      if (!result.ok) {
        setError(result.error ?? "Failed to create order")
        toast.error(result.error ?? "Failed to create order")
        return
      }
      if (result.clientSecret) setClientSecret(result.clientSecret)
      if (result.publishableKey) setPublishableKey(result.publishableKey)
      setStep("payment")
    })
  }

  if (step === "details") {
    return (
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses.length > 0 && (
                <RadioGroup
                  value={selectedAddressId}
                  onValueChange={(v) => setSelectedAddressId(v as string)}
                >
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      htmlFor={`addr-${a.id}`}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted transition-colors",
                        selectedAddressId === a.id && "border-primary bg-primary/5",
                      )}
                    >
                      <RadioGroupItem value={a.id} id={`addr-${a.id}`} className="mt-0.5" />
                      <div className="text-sm flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{a.fullName}</span>
                          {a.isDefault && (
                            <span className="text-xs text-primary">Default</span>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {a.street}, {a.city}, {a.state} {a.zip}, {a.country}
                        </p>
                      </div>
                    </label>
                  ))}
                  <label
                    htmlFor="addr-new"
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted transition-colors",
                      selectedAddressId === "new" && "border-primary bg-primary/5",
                    )}
                  >
                    <RadioGroupItem value="new" id="addr-new" />
                    <span className="text-sm font-medium">Use a different address</span>
                  </label>
                </RadioGroup>
              )}

              {selectedAddressId === "new" && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      value={newAddress.fullName}
                      onChange={(e) =>
                        setNewAddress((a) => ({ ...a, fullName: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">Street</Label>
                    <Input
                      id="street"
                      value={newAddress.street}
                      onChange={(e) =>
                        setNewAddress((a) => ({ ...a, street: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={newAddress.city}
                        onChange={(e) =>
                          setNewAddress((a) => ({ ...a, city: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={newAddress.state}
                        onChange={(e) =>
                          setNewAddress((a) => ({ ...a, state: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP</Label>
                      <Input
                        id="zip"
                        value={newAddress.zip}
                        onChange={(e) =>
                          setNewAddress((a) => ({ ...a, zip: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={newAddress.country}
                      onChange={(e) =>
                        setNewAddress((a) => ({ ...a, country: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={shippingMethod}
                onValueChange={(v) => setShippingMethod(v as "standard" | "express")}
              >
                <label
                  htmlFor="std"
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted transition-colors",
                    shippingMethod === "standard" && "border-primary bg-primary/5",
                  )}
                >
                  <RadioGroupItem value="standard" id="std" />
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Standard (5-7 days)</p>
                    <p className="text-xs text-muted-foreground">
                      {totals.subtotal >= 50 ? "Free" : "$5.00"}
                    </p>
                  </div>
                </label>
                <label
                  htmlFor="exp"
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted transition-colors",
                    shippingMethod === "express" && "border-primary bg-primary/5",
                  )}
                >
                  <RadioGroupItem value="express" id="exp" />
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Express (2-3 days)</p>
                    <p className="text-xs text-muted-foreground">$15.00</p>
                  </div>
                </label>
              </RadioGroup>
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={handleContinue}
            disabled={isCreating}
          >
            {isCreating ? <Loader2 className="animate-spin" /> : <Lock />}
            Continue to payment
          </Button>
        </div>

        <CheckoutSummary
          items={items}
          totals={totals}
          shipping={finalShipping}
          total={finalTotal}
          appliedCoupon={appliedCoupon}
          shippingMethod={shippingMethod}
        />
      </div>
    )
  }

  if (!clientSecret || !publishableKey) {
    return (
      <div className="mt-8 text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-3 text-muted-foreground">Preparing payment...</p>
        {!publishableKey && (
          <p className="mt-2 text-xs text-destructive">
            Stripe publishable key not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <Elements
              stripe={stripePromise(publishableKey)}
              options={{
                clientSecret,
                appearance: { theme: "stripe" },
              }}
            >
              <PaymentForm orderTotal={finalTotal} />
            </Elements>
          </CardContent>
        </Card>
      </div>
      <CheckoutSummary
        items={items}
        totals={totals}
        shipping={finalShipping}
        total={finalTotal}
        appliedCoupon={appliedCoupon}
        shippingMethod={shippingMethod}
      />
    </div>
  )
}

function stripePromise(key: string): Promise<StripeJs | null> {
  return loadStripe(key)
}

function PaymentForm({ orderTotal }: { orderTotal: number }) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    setError(null)

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: "if_required",
    })

    if (submitError) {
      setError(submitError.message ?? "Payment failed")
      setIsProcessing(false)
      return
    }

    if (paymentIntent?.status === "succeeded") {
      router.push(`/checkout/success?payment_intent=${paymentIntent.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock />
            Pay ${orderTotal.toFixed(2)}
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Test card: 4242 4242 4242 4242 — any future date, any CVC
      </p>
    </form>
  )
}

function CheckoutSummary({
  items,
  totals,
  shipping,
  total,
  appliedCoupon,
  shippingMethod,
}: {
  items: Item[]
  totals: { subtotal: number; discount: number; tax: number }
  shipping: number
  total: number
  appliedCoupon: { code: string; type: "PERCENT" | "FIXED"; value: number } | null
  shippingMethod: "standard" | "express"
}) {
  return (
    <aside>
      <Card className="sticky top-20">
        <CardHeader>
          <CardTitle className="text-base">Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm gap-2">
                <span className="text-muted-foreground line-clamp-1 flex-1">
                  {item.quantity} × {item.productName}
                  {item.variantName && (
                    <span className="text-xs ml-1">({item.variantName})</span>
                  )}
                </span>
                <span className="tabular-nums shrink-0">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">${totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount{appliedCoupon && ` (${appliedCoupon.code})`}</span>
                <span className="tabular-nums">-${totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Shipping ({shippingMethod === "express" ? "Express" : "Standard"})
              </span>
              <span className="tabular-nums">
                {shipping === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                ) : (
                  `$${shipping.toFixed(2)}`
                )}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-base">
            <span>Total</span>
            <span className="tabular-nums">${total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
