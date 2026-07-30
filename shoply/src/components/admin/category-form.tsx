"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil, Plus, Save, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveCategoryAction } from "@/server/actions/admin-categories"

type Props = {
  category?: { id: string; name: string; slug: string; description: string | null }
}

export function CategoryForm({ category }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
  })

  if (category && !editing) {
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
      const result = await saveCategoryAction({
        id: category?.id,
        name: form.name,
        slug: form.slug,
        description: form.description || null,
      })
      if (result.ok) {
        toast.success(category ? "Category updated" : "Category created")
        if (!category) {
          setForm({ name: "", slug: "", description: "" })
        } else {
          setEditing(false)
        }
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed")
      }
    })
  }

  const formId = category?.id ?? "new"

  return (
    <form onSubmit={handleSubmit} className={category ? "flex flex-wrap items-end gap-2" : "grid sm:grid-cols-3 gap-3"}>
      <div className="space-y-1 flex-1 min-w-32">
        {category ? null : <Label htmlFor={`name-${formId}`}>Name</Label>}
        <Input
          id={`name-${formId}`}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))}
          required
          minLength={2}
          placeholder={category ? undefined : "Category name"}
        />
      </div>
      <div className="space-y-1 flex-1 min-w-32">
        {category ? null : <Label htmlFor={`slug-${formId}`}>Slug</Label>}
        <Input
          id={`slug-${formId}`}
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
          required
          pattern="[a-z0-9-]+"
          placeholder={category ? undefined : "category-slug"}
        />
      </div>
      {category ? null : (
        <div className="space-y-1 flex-1 min-w-32">
          <Label htmlFor={`desc-${formId}`}>Description</Label>
          <Input
            id={`desc-${formId}`}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Optional"
          />
        </div>
      )}
      <Button type="submit" size={category ? "sm" : "default"} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : category ? <Save /> : <Plus />}
        {category ? "Save" : "Add"}
      </Button>
      {category && (
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
          <X />
          Cancel
        </Button>
      )}
    </form>
  )
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
