"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MapPin, Plus, Star, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction } from "@/server/actions/account"
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

type Props = {
  addresses: Address[]
}

export function AddressesManager({ addresses }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)

  function openNew() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(addr: Address) {
    setEditing(addr)
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button onClick={openNew} variant="outline">
          <Plus />
          Add new address
        </Button>
      )}

      {showForm && (
        <AddressForm
          address={editing}
          onDone={() => {
            setShowForm(false)
            setEditing(null)
          }}
        />
      )}

      {addresses.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No addresses saved yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={() => openEdit(addr)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AddressForm({
  address,
  onDone,
}: {
  address: Address | null
  onDone: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    fullName: address?.fullName ?? "",
    street: address?.street ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    zip: address?.zip ?? "",
    country: address?.country ?? "US",
    isDefault: address?.isDefault ?? false,
  })

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await saveAddressAction({
        id: address?.id,
        ...form,
      })
      if (result.ok) {
        toast.success(address ? "Address updated" : "Address added")
        router.refresh()
        onDone()
      } else {
        toast.error(result.error ?? "Failed")
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{address ? "Edit address" : "New address"}</CardTitle>
        <Button type="button" variant="ghost" size="icon" onClick={onDone}>
          <X />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              required
              minLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="street">Street address</Label>
            <Input
              id="street"
              value={form.street}
              onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
              required
              minLength={3}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                value={form.zip}
                onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isDefault"
              checked={form.isDefault}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, isDefault: checked === true }))
              }
            />
            <Label htmlFor="isDefault" className="font-normal">
              Set as default address
            </Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {address ? "Update" : "Save"} address
            </Button>
            <Button type="button" variant="outline" onClick={onDone}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function AddressCard({
  address,
  onEdit,
}: {
  address: Address
  onEdit: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm("Delete this address?")) return
    startTransition(async () => {
      const result = await deleteAddressAction(address.id)
      if (result.ok) {
        toast.success("Address deleted")
      } else {
        toast.error(result.error ?? "Failed")
      }
    })
  }

  function handleSetDefault() {
    startTransition(async () => {
      const result = await setDefaultAddressAction(address.id)
      if (result.ok) toast.success("Default address updated")
      else toast.error(result.error ?? "Failed")
    })
  }

  return (
    <Card className={cn(address.isDefault && "border-primary")}>
      <CardContent className="p-5 flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium">{address.fullName}</p>
            {address.isDefault && (
              <span className="inline-flex items-center gap-1 text-xs text-primary">
                <Star className="h-3 w-3 fill-primary" />
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {address.street}, {address.city}, {address.state} {address.zip}
          </p>
          <p className="text-sm text-muted-foreground">{address.country}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!address.isDefault && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSetDefault}
              disabled={isPending}
            >
              Set default
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
