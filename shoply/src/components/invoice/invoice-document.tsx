import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 700, color: "#0f172a" },
  subtitle: { fontSize: 9, color: "#64748b", marginTop: 4 },
  brand: { alignItems: "flex-end" },
  brandName: { fontSize: 14, fontWeight: 700, color: "#0f172a" },
  brandSub: { fontSize: 9, color: "#64748b" },
  meta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  metaBlock: { flexDirection: "column" },
  metaLabel: { fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  metaValue: { fontSize: 10, color: "#0f172a" },
  orderNumber: { fontSize: 14, fontWeight: 700, color: "#0f172a" },
  status: {
    display: "flex",
    padding: 4,
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#065f46",
    backgroundColor: "#d1fae5",
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  sectionTitle: {
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
  },
  address: { fontSize: 10, lineHeight: 1.5, color: "#0f172a" },
  table: { marginTop: 12, marginBottom: 16 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 8,
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    fontSize: 10,
  },
  col1: { width: "10%" },
  col2: { width: "50%" },
  col3: { width: "15%", textAlign: "right" },
  col4: { width: "10%", textAlign: "right" },
  col5: { width: "15%", textAlign: "right" },
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  totals: { width: "40%" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    fontSize: 10,
  },
  totalLabel: { color: "#64748b" },
  totalValue: { color: "#0f172a", fontWeight: 500 },
  totalFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 4,
    backgroundColor: "#0f172a",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 700,
  },
  totalFinalLabel: { color: "#ffffff" },
  totalFinalValue: { color: "#ffffff" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
  },
})

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
} | null

type Props = {
  orderNumber: string
  orderDate: string
  status: string
  customerName: string | null
  customerEmail: string
  items: Item[]
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  shippingAddress: Address
}

export function InvoiceDocument(props: Props) {
  const {
    orderNumber,
    orderDate,
    status,
    customerName,
    customerEmail,
    items,
    subtotal,
    discount,
    shipping,
    tax,
    total,
    shippingAddress,
  } = props

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Invoice</Text>
            <Text style={styles.subtitle}>Order #{orderNumber}</Text>
          </View>
          <View style={styles.brand}>
            <Text style={styles.brandName}>Shoply</Text>
            <Text style={styles.brandSub}>Curated essentials</Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.meta}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Billed to</Text>
            <Text style={styles.metaValue}>{customerName ?? "—"}</Text>
            <Text style={styles.metaValue}>{customerEmail}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Order date</Text>
            <Text style={styles.metaValue}>{orderDate}</Text>
            <Text style={[styles.metaValue, { marginTop: 8 }]}>Status</Text>
            <Text style={styles.metaValue}>{status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Shipping Address */}
        {shippingAddress && (
          <View>
            <Text style={styles.sectionTitle}>Ship to</Text>
            <View style={styles.address}>
              <Text>{shippingAddress.fullName}</Text>
              <Text>{shippingAddress.street}</Text>
              <Text>
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
              </Text>
              <Text>{shippingAddress.country}</Text>
            </View>
          </View>
        )}

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>QTY</Text>
            <Text style={styles.col2}>ITEM</Text>
            <Text style={styles.col3}>PRICE</Text>
            <Text style={styles.col4}>QTY</Text>
            <Text style={styles.col5}>TOTAL</Text>
          </View>
          {items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.col1}>{item.quantity}</Text>
              <View style={styles.col2}>
                <Text>{item.productName}</Text>
                {item.variantName && (
                  <Text style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>
                    {item.variantName}
                  </Text>
                )}
              </View>
              <Text style={styles.col3}>${item.price.toFixed(2)}</Text>
              <Text style={styles.col4}>×{item.quantity}</Text>
              <Text style={styles.col5}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsWrap}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, { color: "#059669" }]}>
                  -${discount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping</Text>
              <Text style={styles.totalValue}>
                {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
              </Text>
            </View>
            {tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.totalFinal}>
              <Text style={styles.totalFinalLabel}>Total</Text>
              <Text style={styles.totalFinalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          Thank you for your purchase! · Shoply · {new Date().getFullYear()}
        </View>
      </Page>
    </Document>
  )
}
