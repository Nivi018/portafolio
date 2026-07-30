import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

type Props = {
  customerName: string | null
  orderNumber: string
  orderId: string
  appUrl: string
  trackingNumber?: string
  carrier?: string
}

const styles = {
  body: { backgroundColor: "#f6f9fc", fontFamily: "Inter, -apple-system, sans-serif", margin: 0, padding: 0 },
  container: { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" },
  card: { backgroundColor: "#ffffff", borderRadius: "12px", padding: "40px", border: "1px solid #e5e7eb" },
  heading: { fontSize: "24px", fontWeight: 600, color: "#0f172a", margin: "0 0 16px" },
  text: { color: "#475569", fontSize: "14px", lineHeight: "1.6", margin: "0 0 12px" },
  badge: {
    display: "inline-block",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
    margin: "0 0 24px",
  },
  orderBox: {
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "8px",
    margin: "16px 0",
  },
  orderNumber: { fontFamily: "monospace", fontSize: "14px", color: "#0f172a", fontWeight: 600 },
  button: {
    display: "inline-block",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 600,
    margin: "16px 0",
  },
  footer: { color: "#94a3b8", fontSize: "12px", textAlign: "center" as const, marginTop: "32px" },
  detail: { display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px" },
  detailLabel: { color: "#64748b" },
  detailValue: { color: "#0f172a", fontWeight: 500 },
}

export function OrderShippedEmail({
  customerName,
  orderNumber,
  orderId,
  appUrl,
  trackingNumber,
  carrier,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your order {orderNumber} is on its way</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <div style={styles.card}>
            <div style={styles.badge}>📦 Shipped</div>
            <Heading style={styles.heading}>Your order is on the way!</Heading>
            <Text style={styles.text}>
              Hi {customerName ?? "there"}, good news — your order has shipped and is heading your way.
            </Text>

            <div style={styles.orderBox}>
              <Text style={{ ...styles.text, margin: 0, color: "#64748b", fontSize: "12px" }}>
                Order number
              </Text>
              <Text style={styles.orderNumber}>{orderNumber}</Text>
            </div>

            {trackingNumber && (
              <div style={styles.orderBox}>
                <Text style={{ ...styles.text, margin: 0, color: "#64748b", fontSize: "12px" }}>
                  {carrier ? `${carrier} tracking` : "Tracking number"}
                </Text>
                <Text style={{ ...styles.orderNumber, marginTop: "4px" }}>{trackingNumber}</Text>
              </div>
            )}

            <Text style={styles.text}>
              You can track your package and view full order details anytime in your account.
            </Text>

            <a href={`${appUrl}/account/orders/${orderId}`} style={styles.button}>
              Track your order
            </a>
          </div>

          <Text style={styles.footer}>
            Shoply · <a href={appUrl} style={{ color: "#94a3b8" }}>{appUrl.replace("https://", "")}</a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
