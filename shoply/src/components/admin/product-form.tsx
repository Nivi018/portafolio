"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { saveProductAction } from "@/server/actions/admin-products"

type ProductInput = {
  id?: string
  name: string
  slug: string
  description: string
  shortDesc: string | null
  price: number
  comparePrice: number | null
  type: "PHYSICAL" | "DIGITAL"
  categoryId: string
  stock: number
  active: boolean
  featured: boolean
  sku: string | null
  weight: number | null
  requiresShipping: boolean
  downloadUrl: string | null
  downloadLimit: number | null
  image?: string
}

type Props = {
  product: ProductInput | null
  categories: { id: string; name: string }[]
}

export function ProductForm({ product, categories }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [image, setImage] = useState(product?.image ?? "")
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    shortDesc: product?.shortDesc ?? "",
    price: product?.price?.toString() ?? "",
    comparePrice: product?.comparePrice?.toString() ?? "",
    type: product?.type ?? ("PHYSICAL" as "PHYSICAL" | "DIGITAL"),
    categoryId: product?.categoryId ?? categories[0]?.id ?? "",
    stock: product?.stock?.toString() ?? "0",
    active: product?.active ?? true,
    featured: product?.featured ?? false,
    sku: product?.sku ?? "",
    weight: product?.weight?.toString() ?? "",
    requiresShipping: product?.requiresShipping ?? true,
    downloadUrl: product?.downloadUrl ?? "",
    downloadLimit: product?.downloadLimit?.toString() ?? "",
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await saveProductAction({
        id: product?.id,
        name: form.name,
        slug: form.slug,
        description: form.description,
        shortDesc: form.shortDesc || null,
        price: form.price,
        comparePrice: form.comparePrice || null,
        type: form.type,
        categoryId: form.categoryId,
        stock: form.stock,
        active: form.active,
        featured: form.featured,
        weight: form.weight || null,
        requiresShipping: form.requiresShipping,
        downloadUrl: form.downloadUrl || null,
        downloadLimit: form.downloadLimit || null,
      })
      if (result.ok) {
        toast.success(product ? "Product updated" : "Product created")
        router.push("/admin/products")
      } else {
        toast.error(result.error ?? "Failed")
      }
    })
  }

  async function handleImageUpload(file: File) {
    setUploading(true)
    // In a real implementation, this would upload to Cloudinary via signed upload.
    // For now, simulate with a local preview.
    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target?.result as string)
      setUploading(false)
      toast.success("Image preview loaded (Cloudinary upload not configured)")
    }
    reader.readAsDataURL(file)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
                required
                pattern="[a-z0-9-]+"
                placeholder="my-product-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortDesc">Short description</Label>
            <Input
              id="shortDesc"
              value={form.shortDesc}
              onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))}
              placeholder="One-liner for product cards"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
              minLength={10}
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-24 w-24 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center text-xs text-muted-foreground">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                "No image"
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="image">Image URL or upload</Label>
              <Input
                id="image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  render={
                    <label htmlFor="upload" className="cursor-pointer">
                      <Upload />
                      {uploading ? "Uploading..." : "Upload"}
                    </label>
                  }
                />
                <input
                  id="upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleImageUpload(f)
                  }}
                />
                {image && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setImage("")}
                  >
                    <X />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Configure Cloudinary to enable real uploads. Preview only for now.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing & inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comparePrice">Compare at price (optional)</Label>
              <Input
                id="comparePrice"
                type="number"
                step="0.01"
                min="0"
                value={form.comparePrice}
                onChange={(e) => setForm((f) => ({ ...f, comparePrice: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                disabled={form.type === "DIGITAL"}
              />
              {form.type === "DIGITAL" && (
                <p className="text-xs text-muted-foreground">Digital products have unlimited stock</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => v && setForm((f) => ({ ...f, type: v as "PHYSICAL" | "DIGITAL" }))}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHYSICAL">Physical</SelectItem>
                  <SelectItem value="DIGITAL">Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => v && setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger id="categoryId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.type === "PHYSICAL" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (grams)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <Checkbox
                  id="requiresShipping"
                  checked={form.requiresShipping}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, requiresShipping: c === true }))}
                />
                <Label htmlFor="requiresShipping" className="font-normal">
                  Requires shipping
                </Label>
              </div>
            </div>
          )}

          {form.type === "DIGITAL" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="downloadUrl">Download URL (Supabase Storage path)</Label>
                <Input
                  id="downloadUrl"
                  value={form.downloadUrl}
                  onChange={(e) => setForm((f) => ({ ...f, downloadUrl: e.target.value }))}
                  placeholder="products/my-digital-product.zip"
                />
                <p className="text-xs text-muted-foreground">
                  Configure Supabase Storage to enable downloads.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="downloadLimit">Download limit (per purchase)</Label>
                <Input
                  id="downloadLimit"
                  type="number"
                  min="0"
                  value={form.downloadLimit}
                  onChange={(e) => setForm((f) => ({ ...f, downloadLimit: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Leave empty for unlimited downloads</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="active"
                checked={form.active}
                onCheckedChange={(c) => setForm((f) => ({ ...f, active: c === true }))}
              />
              <Label htmlFor="active" className="font-normal">
                Active (visible in store)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="featured"
                checked={form.featured}
                onCheckedChange={(c) => setForm((f) => ({ ...f, featured: c === true }))}
              />
              <Label htmlFor="featured" className="font-normal">
                Featured (show on homepage)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Save />}
          {product ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="outline" render={<a href="/admin/products" />}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
