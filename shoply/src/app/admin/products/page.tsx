import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/format"
import { AdminProductsFilters } from "@/components/admin/admin-products-filters"
import { ProductRowActions } from "@/components/admin/product-row-actions"
import { ProductsBulkActions } from "@/components/admin/products-bulk-actions"

export const metadata = { title: "Products" }

type SearchParams = Promise<{ q?: string; type?: string; page?: string }>

const PAGE_SIZE = 20

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, type, page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10) || 1)

  const where = {
    ...(type ? { type: type as "PHYSICAL" | "DIGITAL" } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        images: { take: 1, orderBy: { position: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (pageNum - 1) * PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">{total} products</p>
        </div>
        <Button render={<Link href="/admin/products/new" />}>
          <Plus />
          New product
        </Button>
      </div>

      <AdminProductsFilters currentType={type} currentQuery={q} categories={categories.map((c) => c.name)} />

      <ProductsBulkActions
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          active: p.active,
          featured: p.featured,
        }))}
      />

      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No products</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-muted overflow-hidden shrink-0 relative">
                          {p.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.images[0].url}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline line-clamp-1">
                            {p.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{p.sku ?? "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.type === "DIGITAL" ? "secondary" : "outline"}>
                        {p.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.category.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPrice(p.price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={
                          p.stock <= 5 && p.type === "PHYSICAL"
                            ? "text-amber-600 dark:text-amber-400 font-semibold"
                            : ""
                        }
                      >
                        {p.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.active ? "default" : "outline"}>
                        {p.active ? "Active" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ProductRowActions productId={p.id} active={p.active} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {pageNum > 1 && (
            <Button
              variant="outline"
              size="sm"
              render={
                <Link
                  href={`/admin/products?page=${pageNum - 1}${type ? `&type=${type}` : ""}${q ? `&q=${q}` : ""}`}
                />
              }
            >
              Previous
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {pageNum} of {totalPages}
          </span>
          {pageNum < totalPages && (
            <Button
              variant="outline"
              size="sm"
              render={
                <Link
                  href={`/admin/products?page=${pageNum + 1}${type ? `&type=${type}` : ""}${q ? `&q=${q}` : ""}`}
                />
              }
            >
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
