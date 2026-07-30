"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil, Plus, Save, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { saveCouponAction } from "@/server/actions/admin-coupons"

type Coupon = {
  id: string
  code: string
  type: "PERCENT" | "FIXED"
  value: number
  minPurchase: number | null
  maxUses: number | null
  expiresAt: string | null
  active: boolean
}

type Props = { coupon?: Coupon }

export function CouponForm({ coupon }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    code: coupon?.code ?? "",
    type: coupon?.type ?? ("PERCENT" as "PERCENT" | "FIXED"),
    value: coupon?.value?.toString() ?? "",
    minPurchase: coupon?.minPurchase?.toString() ?? "",
    maxUses: coupon?.maxUses?.toString() ?? "",
    expiresAt: coupon?.expiresAt ?? "",
    active: coupon?.active ?? true,
  })

  const formId = coupon?.id ?? "new"

  if (coupon && !editing) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
        <Pencil />
        Edit
      </Button>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await saveCouponAction({
        id: coupon?.id,
        code: form.code,
        type: form.type,
        value: form.value,
        minPurchase: form.minPurchase || null,
        maxUses: form.maxUses || null,
        expiresAt: form.expiresAt || null,
        active: form.active,
      })
      if (result.ok) {
        toast.success(coupon ? "Coupon updated" : "Coupon created")
        if (!coupon) {
          setForm({ code: "", type: "PERCENT", value: "", minPurchase: "", maxUses: "", expiresAt: "", active: true })
        } else {
          setEditing(false)
        }
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className={coupon ? "flex flex-wrap items-end gap-2" : "space-y-3"}>
      <div className={coupon ? "flex flex-wrap gap-2" : "grid sm:grid-cols-4 gap-3"}>
        <div className="space-y-1">
          {coupon ? null : <Label htmlFor="code">Code</Label>}
          <Input
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="SAVE20"
            required
            minLength={2}
            className="w-28 font-mono"
          />
        </div>
        <div className="space-y-1">
          {coupon ? null : <Label htmlFor="type">Type</Label>}
          <Select value={form.type} onValueChange={(v) => v && setForm((f) => ({ ...f, type: v as "PERCENT" | "FIXED" }))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENT">Percent</SelectItem>
              <SelectItem value="FIXED">Fixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          {coupon ? null : <Label htmlFor="value">Value</Label>}
          <Input
            type="number"
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            placeholder={form.type === "PERCENT" ? "10" : "20"}
            required
            min="0"
            step="0.01"
            className="w-24"
          />
        </div>
        <div className="space-y-1">
          {coupon ? null : <Label htmlFor="minPurchase">Min purchase</Label>}
          <Input
            type="number"
            value={form.minPurchase}
            onChange={(e) => setForm((f) => ({ ...f, minPurchase: e.target.value }))}
            placeholder="0"
            min="0"
            className="w-28"
          />
        </div>
        <div className="space-y-1">
          {coupon ? null : <Label htmlFor="maxUses">Max uses</Label>}
          <Input
            type="number"
            value={form.maxUses}
            onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
            placeholder="∞"
            min="0"
            className="w-24"
          />
        </div>
        <div className="space-y-1">
          {coupon ? null : <Label htmlFor="expiresAt">Expires</Label>}
          <Input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            className="w-40"
          />
        </div>
      </div>
      {coupon ? null : (
        <div className="flex items-center gap-2">
          <Checkbox
            id={`active-${formId}`}
            checked={form.active}
            onCheckedChange={(c) => setForm((f) => ({ ...f, active: c === true }))}
          />
          <Label htmlFor={`active-${formId}`} className="font-normal">
            Active
          </Label>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button type="submit" size={coupon ? "sm" : "default"} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : coupon ? <Save /> : <Plus />}
          {coupon ? "Save" : "Create coupon"}
        </Button>
        {coupon && (
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            <X />
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
