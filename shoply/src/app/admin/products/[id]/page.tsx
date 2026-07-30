import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { ProductForm } from "@/components/admin/product-form"
import type { Prisma } from "@/generated/prisma/client"

type Params = Promise<{ id: string }>

type ProductFull = Prisma.ProductGetPayload<{
  include: { variants: true; images: true }
}>

export default async function AdminProductEditPage({ params }: { params: Params }) {
  const { id } = await params
  const isNew = id === "new"

  const [product, categories] = await Promise.all([
    isNew
      ? Promise.resolve(null)
      : prisma.product.findUnique({
          where: { id },
          include: { variants: true, images: true },
        }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  if (!isNew && !product) notFound()

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" className="-ml-2" render={<Link href="/admin/products" />}>
        <ArrowLeft />
        Back to products
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">
        {isNew ? "New product" : `Edit ${product?.name}`}
      </h1>

      <ProductForm
        product={
          product
            ? {
                id: product.id,
                name: product.name,
                slug: product.slug,
                description: product.description,
                shortDesc: product.shortDesc,
                price: Number(product.price),
                comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
                type: product.type as "PHYSICAL" | "DIGITAL",
                categoryId: product.categoryId,
                stock: product.stock,
                active: product.active,
                featured: product.featured,
                sku: product.sku,
                weight: product.weight ? Number(product.weight) : null,
                requiresShipping: product.requiresShipping,
                downloadUrl: product.downloadUrl,
                downloadLimit: product.downloadLimit,
                image: product.images[0]?.url,
              }
            : null
        }
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  )
}
