import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Tags } from "lucide-react"
import { CategoryForm } from "@/components/admin/category-form"
import { DeleteCategoryButton } from "@/components/admin/delete-category-button"

export const metadata = { title: "Categories" }

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4" /> New category
          </h2>
          <CategoryForm />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12 flex flex-col items-center gap-2">
              <Tags className="h-6 w-6 opacity-50" />
              No categories
            </p>
          ) : (
            <ul className="divide-y">
              {categories.map((c) => (
                <li key={c.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">/{c.slug}</p>
                    {c.description && (
                      <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {c._count.products} {c._count.products === 1 ? "product" : "products"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CategoryForm
                      category={{ id: c.id, name: c.name, slug: c.slug, description: c.description }}
                    />
                    <DeleteCategoryButton id={c.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
