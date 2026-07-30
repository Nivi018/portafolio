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

type Item = {
  productName: string
  variantName: string | null
  quantity: number
  price: number
}

type Address = {
  fullName: string
  street: string
  city: string
  state: string
  zip: string
  country: string
}

type Props = {
  customerName: string | null
  orderNumber: string
  orderId: string
  items: Item[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  shippingAddress: Address | null
  appUrl: string
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
  orderBox: { backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", margin: "16px 0" },
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
  item: {
    padding: "10px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  itemName: { fontSize: "14px", color: "#0f172a", fontWeight: 500 },
  itemMeta: { fontSize: "12px", color: "#64748b", marginTop: "2px" },
  itemPrice: { fontSize: "14px", color: "#0f172a", fontWeight: 500, marginTop: "4px" },
  detail: { display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px" },
  detailLabel: { color: "#64748b" },
  detailValue: { color: "#0f172a", fontWeight: 500 },
  total: { fontSize: "16px", fontWeight: 700, color: "#0f172a" },
  address: { backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "#0f172a" },
}

export function OrderConfirmationEmail({
  customerName,
  orderNumber,
  orderId,
  items,
  subtotal,
  discount,
  shipping,
  total,
  shippingAddress,
  appUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Order {orderNumber} confirmed</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <div style={styles.card}>
            <div style={styles.badge}>✓ Confirmed</div>
            <Heading style={styles.heading}>Thanks for your order!</Heading>
            <Text style={styles.text}>
              Hi {customerName ?? "there"}, we&apos;ve received your order and it&apos;s being processed.
            </Text>

            <div style={styles.orderBox}>
              <Text style={{ ...styles.text, margin: 0, color: "#64748b", fontSize: "12px" }}>
                Order number
              </Text>
              <Text style={styles.orderNumber}>{orderNumber}</Text>
            </div>

            <Section>
              <Text style={{ ...styles.text, fontWeight: 600, marginTop: "24px" }}>Items</Text>
              {items.map((item, idx) => (
                <div key={idx} style={styles.item}>
                  <div style={styles.itemName}>{item.productName}</div>
                  {item.variantName && <div style={styles.itemMeta}>{item.variantName}</div>}
                  <div style={styles.itemMeta}>
                    {item.quantity} × ${item.price.toFixed(2)}
                  </div>
                  <div style={styles.itemPrice}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </Section>

            <Section style={{ marginTop: "16px" }}>
              <div style={styles.detail}>
                <span style={styles.detailLabel}>Subtotal</span>
                <span style={styles.detailValue}>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={styles.detail}>
                  <span style={styles.detailLabel}>Discount</span>
                  <span style={{ ...styles.detailValue, color: "#059669" }}>
                    -${discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div style={styles.detail}>
                <span style={styles.detailLabel}>Shipping</span>
                <span style={styles.detailValue}>
                  {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div style={{ ...styles.detail, marginTop: "8px", borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
                <span style={styles.total}>Total</span>
                <span style={styles.total}>${total.toFixed(2)}</span>
              </div>
            </Section>

            {shippingAddress && (
              <Section style={{ marginTop: "24px" }}>
                <Text style={{ ...styles.text, fontWeight: 600, marginBottom: "8px" }}>
                  Shipping to
                </Text>
                <div style={styles.address}>
                  <div>{shippingAddress.fullName}</div>
                  <div>{shippingAddress.street}</div>
                  <div>
                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
                  </div>
                  <div>{shippingAddress.country}</div>
                </div>
              </Section>
            )}

            <a href={`${appUrl}/account/orders/${orderId}`} style={styles.button}>
              View order
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
