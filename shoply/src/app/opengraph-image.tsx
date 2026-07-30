import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Shoply — Curated essentials, delivered"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#f8fafc",
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>Shoply</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
            }}
          >
            Curated essentials, delivered.
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: "#94a3b8",
            }}
          >
            A curated marketplace for physical and digital products. Fast checkout, secure payments, beautiful experience.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 20,
            color: "#cbd5e1",
          }}
        >
          <span>Free shipping over $50</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>30-day returns</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>Secure checkout</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
