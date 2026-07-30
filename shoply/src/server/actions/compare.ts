"use server"

import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const COMPARE_COOKIE = "shoply_compare"
const COMPARE_MAX = 4

type CompareItem = {
  id: string
  slug: string
  name: string
}

function parseCompareCookie(value: string | undefined): CompareItem[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(decodeURIComponent(value))
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is CompareItem =>
        item &&
        typeof item.id === "string" &&
        typeof item.slug === "string" &&
        typeof item.name === "string",
    )
  } catch {
    return []
  }
}

export async function getCompareItems(): Promise<CompareItem[]> {
  const cookieStore = await cookies()
  return parseCompareCookie(cookieStore.get(COMPARE_COOKIE)?.value)
}

export async function addToCompare(productId: string): Promise<{ items: CompareItem[] }> {
  const product = await prisma.product.findUnique({
    where: { id: productId, active: true },
    select: { id: true, slug: true, name: true },
  })
  if (!product) return { items: await getCompareItems() }

  const items = await getCompareItems()
  if (items.some((i) => i.id === product.id)) return { items }
  if (items.length >= COMPARE_MAX) {
    return { items } // max reached
  }

  const newItems = [...items, product]
  const cookieStore = await cookies()
  cookieStore.set(COMPARE_COOKIE, encodeURIComponent(JSON.stringify(newItems)), {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
  })
  revalidatePath("/compare")
  return { items: newItems }
}

export async function removeFromCompare(productId: string): Promise<{ items: CompareItem[] }> {
  const items = await getCompareItems()
  const newItems = items.filter((i) => i.id !== productId)
  const cookieStore = await cookies()
  if (newItems.length === 0) {
    cookieStore.delete(COMPARE_COOKIE)
  } else {
    cookieStore.set(COMPARE_COOKIE, encodeURIComponent(JSON.stringify(newItems)), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    })
  }
  revalidatePath("/compare")
  return { items: newItems }
}

export async function clearCompare(): Promise<{ items: CompareItem[] }> {
  const cookieStore = await cookies()
  cookieStore.delete(COMPARE_COOKIE)
  revalidatePath("/compare")
  return { items: [] }
}

const shareSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1).max(COMPARE_MAX),
  expiresInDays: z.number().int().min(1).max(30).default(7),
})

/**
 * Create a shareable link for a compare list. The link contains the product
 * IDs that can be hydrated on the receiving end.
 */
export async function createCompareShareLink(input: z.input<typeof shareSchema>) {
  const parsed = shareSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  // Validate that the products exist
  const products = await prisma.product.findMany({
    where: { id: { in: parsed.data.itemIds }, active: true },
    select: { id: true, slug: true, name: true },
  })

  if (products.length === 0) return { ok: false, error: "No valid products" }

  // Generate a random share ID
  const shareId = crypto.randomUUID().slice(0, 12)
  const cookieStore = await cookies()
  const shareData = {
    id: shareId,
    items: products,
    expiresAt: Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000,
  }
  cookieStore.set(
    `${COMPARE_COOKIE}_shared`,
    encodeURIComponent(JSON.stringify(shareData)),
    {
      path: "/",
      maxAge: parsed.data.expiresInDays * 24 * 60 * 60,
      sameSite: "lax",
    },
  )
  return { ok: true, shareId, url: `/compare?share=${shareId}` }
}

export async function loadSharedCompare(shareId: string): Promise<CompareItem[]> {
  const cookieStore = await cookies()
  const value = cookieStore.get(`${COMPARE_COOKIE}_shared`)?.value
  if (!value) return []
  try {
    const data = JSON.parse(decodeURIComponent(value))
    if (data.id !== shareId || data.expiresAt < Date.now()) return []
    return Array.isArray(data.items) ? data.items : []
  } catch {
    return []
  }
}
