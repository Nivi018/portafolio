import Link from "next/link"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

type Props = {
  currentStatus?: string
}

export async function ExportOrdersButton({ currentStatus }: Props) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") return null

  // Just render the link — actual export handled by API route
  return (
    <Button
      size="sm"
      variant="outline"
      render={
        <Link
          href={`/api/admin/orders/export${currentStatus ? `?status=${currentStatus}` : ""}`}
          prefetch={false}
        />
      }
    >
      <Download />
      Export CSV
    </Button>
  )
}
