import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit"
import Fuse from "fuse.js"

export async function GET(request: Request) {
  const key = getRateLimitKey(request, "search")
  const rl = rateLimit(key, 30, 60_000) // 30 req/min per IP
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    )
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() ?? ""

  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        description: true,
        sku: true,
        images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
      },
      take: 100, // Fuse will rank and limit
      orderBy: { createdAt: "desc" },
    })

    // Fuzzy search with Fuse.js
    const fuse = new Fuse(products, {
      keys: [
        { name: "name", weight: 0.5 },
        { name: "description", weight: 0.3 },
        { name: "sku", weight: 0.2 },
      ],
      threshold: 0.4, // Lower = stricter matching
      distance: 100,
      includeScore: true,
      minMatchCharLength: 2,
    })

    const results = fuse.search(q).slice(0, 8)
    const lower = q.toLowerCase()

    return NextResponse.json({
      results: results.map((r) => {
        const p = r.item
        const idx = p.name.toLowerCase().indexOf(lower)
        const matchRanges: Array<[number, number]> = []
        if (idx >= 0) matchRanges.push([idx, idx + q.length])
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.price),
          image: p.images[0]?.url,
          matchRanges,
        }
      }),
    })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
