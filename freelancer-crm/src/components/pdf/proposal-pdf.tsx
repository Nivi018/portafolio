import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1e293b",
  },
  proposalInfo: {
    textAlign: "right",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1e293b",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    fontWeight: "bold",
    marginRight: 8,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 8,
    fontWeight: "bold",
    borderBottom: "1pt solid #cbd5e1",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottom: "1pt solid #e2e8f0",
  },
  col1: { width: "50%" },
  col2: { width: "15%", textAlign: "right" },
  col3: { width: "17.5%", textAlign: "right" },
  col4: { width: "17.5%", textAlign: "right" },
  totals: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    marginTop: 4,
    width: "40%",
  },
  totalLabel: {
    width: "60%",
    textAlign: "right",
    paddingRight: 10,
  },
  totalValue: {
    width: "40%",
    textAlign: "right",
    fontWeight: "bold",
  },
  grandTotal: {
    fontSize: 14,
    borderTop: "1pt solid #cbd5e1",
    paddingTop: 6,
    marginTop: 6,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 9,
  },
  statusBadge: {
    marginTop: 4,
    padding: 4,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
  },
})

interface ProposalItem {
  description: string
  quantity: number
  unitPrice: number
}

interface ProposalPDFProps {
  proposal: {
    title: string
    status: string
    content: string | null
    validUntil: Date | null
    createdAt: Date
    subtotal: number
    taxRate: number
    tax: number
    total: number
    project: {
      name: string
      client: {
        name: string
        email: string | null
        company: string | null
        address: string | null
        phone: string | null
      }
    }
    items: ProposalItem[]
  }
  organization: {
    name: string
  }
}

export function ProposalPDF({ proposal, organization }: ProposalPDFProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>PROPOSAL</Text>
            <Text style={styles.proposalInfo}>{proposal.title}</Text>
          </View>
          <View style={styles.proposalInfo}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              {organization.name}
            </Text>
            <Text style={styles.statusBadge}>{proposal.status}</Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prepared For</Text>
          <Text style={{ fontWeight: "bold" }}>{proposal.project.client.name}</Text>
          {proposal.project.client.company && (
            <Text>{proposal.project.client.company}</Text>
          )}
          {proposal.project.client.email && (
            <Text>{proposal.project.client.email}</Text>
          )}
          {proposal.project.client.phone && (
            <Text>{proposal.project.client.phone}</Text>
          )}
          {proposal.project.client.address && (
            <Text>{proposal.project.client.address}</Text>
          )}
        </View>

        {/* Proposal Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text>{formatDate(proposal.createdAt)}</Text>
          </View>
          {proposal.validUntil && (
            <View style={styles.row}>
              <Text style={styles.label}>Valid Until:</Text>
              <Text>{formatDate(proposal.validUntil)}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Project:</Text>
            <Text>{proposal.project.name}</Text>
          </View>
        </View>

        {/* Description */}
        {proposal.content && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text>{proposal.content}</Text>
          </View>
        )}

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col2}>Qty</Text>
            <Text style={styles.col3}>Unit Price</Text>
            <Text style={styles.col4}>Total</Text>
          </View>
          {proposal.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>${item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.col4}>${(item.quantity * item.unitPrice).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>${proposal.subtotal.toFixed(2)}</Text>
          </View>
          {proposal.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({proposal.taxRate}%):</Text>
              <Text style={styles.totalValue}>${proposal.tax.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${proposal.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This proposal is valid for 30 days unless otherwise noted. | Generated by FreelancerCRM
        </Text>
      </Page>
    </Document>
  )
}
