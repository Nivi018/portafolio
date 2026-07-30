import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const alt = "Shoply"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

type Props = { params: Promise<{ slug: string }> }

export default async function ProductOGImage({ params }: Props) {
  const { slug } = await params
  const product = await prisma.product
    .findUnique({
      where: { slug, active: true },
      include: { images: { take: 1 }, category: true },
    })
    .catch(() => null)

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            color: "#f8fafc",
            fontSize: 48,
          }}
        >
          Product not found
        </div>
      ),
      { ...size },
    )
  }

  const imageUrl = product.images[0]?.url

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100%",
          background: "#f8fafc",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 720,
            height: 630,
            padding: "60px 50px",
            color: "#0f172a",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#0f172a",
                color: "#f8fafc",
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              S
            </div>
            <div
              style={{
                marginLeft: 12,
                fontSize: 20,
                fontWeight: 700,
                color: "#475569",
                display: "flex",
              }}
            >
              Shoply
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 18,
              }}
            >
              {product.category.name}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 54,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "#0f172a",
                marginBottom: 18,
              }}
            >
              {product.name}
            </div>
            {product.shortDesc && (
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  lineHeight: 1.4,
                  color: "#64748b",
                  maxWidth: 500,
                  marginBottom: 18,
                }}
              >
                {product.shortDesc}
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                marginTop: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 48,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                ${Number(product.price).toFixed(2)}
              </div>
              {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                <div
                  style={{
                    display: "flex",
                    marginLeft: 16,
                    fontSize: 26,
                    color: "#94a3b8",
                    textDecoration: "line-through",
                  }}
                >
                  ${Number(product.comparePrice).toFixed(2)}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex" }} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 480,
            height: 630,
            background: "#e2e8f0",
            overflow: "hidden",
          }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.name}
              width={480}
              height={630}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                fontSize: 24,
              }}
            >
              No image
            </div>
          )}
        </div>
      </div>
    ),
    { ...size },
  )
}
