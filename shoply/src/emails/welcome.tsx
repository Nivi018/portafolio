import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components"

type Props = {
  name: string
  appUrl: string
}

const styles = {
  body: { backgroundColor: "#f6f9fc", fontFamily: "Inter, -apple-system, sans-serif", margin: 0, padding: 0 },
  container: { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" },
  card: { backgroundColor: "#ffffff", borderRadius: "12px", padding: "40px", border: "1px solid #e5e7eb" },
  heading: { fontSize: "28px", fontWeight: 600, color: "#0f172a", margin: "0 0 16px" },
  text: { color: "#475569", fontSize: "14px", lineHeight: "1.6", margin: "0 0 12px" },
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
  promo: { backgroundColor: "#fef3c7", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", color: "#78350f", margin: "16px 0" },
  promoCode: { fontFamily: "monospace", fontWeight: 700 },
}

export function WelcomeEmail({ name, appUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Shoply</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <div style={styles.card}>
            <Heading style={styles.heading}>Welcome to Shoply!</Heading>
            <Text style={styles.text}>Hi {name},</Text>
            <Text style={styles.text}>
              We&apos;re so glad you&apos;re here. Shoply is a curated marketplace for physical and digital essentials — designed to be fast, simple, and beautiful.
            </Text>
            <Text style={styles.text}>
              Here are a few things you can do to get started:
            </Text>
            <ul style={{ ...styles.text, paddingLeft: "20px" }}>
              <li>Browse our curated catalog of products</li>
              <li>Save your favorites to your wishlist</li>
              <li>Save an address for faster checkout</li>
            </ul>

            <div style={styles.promo}>
              🎁 Use code <span style={styles.promoCode}>WELCOME10</span> for 10% off your first order over $50.
            </div>

            <a href={`${appUrl}/products`} style={styles.button}>
              Start shopping
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
