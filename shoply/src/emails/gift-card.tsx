import { Button } from "@/components/ui/button"

type Props = {
  code: string
  amount: number
  recipientName: string
  senderName: string
  message: string | null
  redeemUrl: string
  expiresAt: string
}

const styles = {
  body: { backgroundColor: "#f6f9fc", fontFamily: "Inter, -apple-system, sans-serif", margin: 0, padding: 0 },
  container: { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" },
  card: { backgroundColor: "#ffffff", borderRadius: "12px", padding: "40px", border: "1px solid #e5e7eb" },
  badge: {
    display: "inline-block",
    backgroundColor: "#fef3c7",
    color: "#78350f",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
    margin: "0 0 24px",
  },
  heading: { fontSize: "28px", fontWeight: 700, color: "#0f172a", margin: "0 0 16px" },
  text: { color: "#475569", fontSize: "15px", lineHeight: 1.6, margin: "0 0 16px" },
  amount: { fontSize: "48px", fontWeight: 800, color: "#0f172a", margin: "16px 0" },
  codeBox: {
    backgroundColor: "#f1f5f9",
    padding: "16px",
    borderRadius: "8px",
    margin: "20px 0",
    textAlign: "center" as const,
  },
  code: {
    fontFamily: "monospace",
    fontSize: "20px",
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "0.1em",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "14px 28px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 600,
    margin: "16px 0",
  },
  message: {
    backgroundColor: "#f8fafc",
    borderLeft: "3px solid #0f172a",
    padding: "12px 16px",
    fontStyle: "italic" as const,
    color: "#475569",
    margin: "20px 0",
  },
  footer: { color: "#94a3b8", fontSize: "12px", textAlign: "center" as const, marginTop: "32px" },
}

export function GiftCardEmail({
  code,
  amount,
  recipientName,
  senderName,
  message,
  redeemUrl,
  expiresAt,
}: Props) {
  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.badge}>🎁 Gift Card</div>
          <h1 style={styles.heading}>You have a gift!</h1>
          <p style={styles.text}>Hi {recipientName}, {senderName} sent you a Shoply gift card.</p>

          <div style={styles.amount}>${amount.toFixed(2)}</div>

          {message && <div style={styles.message}>&ldquo;{message}&rdquo;</div>}

          <div style={styles.codeBox}>
            <p style={{ ...styles.text, fontSize: "12px", marginBottom: 4 }}>
              Your code
            </p>
            <div style={styles.code}>{code}</div>
          </div>

          <div style={{ textAlign: "center" as const }}>
            <a href={redeemUrl} style={styles.button}>
              Redeem now
            </a>
          </div>

          <p style={{ ...styles.text, fontSize: "12px", marginTop: "24px" }}>
            Valid until {expiresAt}. Apply at checkout to use your balance.
          </p>
        </div>
        <p style={styles.footer}>
          Shoply · <a href="https://shoply.dev" style={{ color: "#94a3b8" }}>shoply.dev</a>
        </p>
      </div>
    </div>
  )
}
