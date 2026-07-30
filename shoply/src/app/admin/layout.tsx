import type { Metadata } from "next"
import Link from "next/link"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tags,
  TicketPercent,
  Users,
  Bell,
  MessageSquare,
  HelpCircle,
} from "lucide-react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { AdminNotificationsBell } from "@/components/admin/notifications-bell"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Admin" }

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/questions", label: "Questions", icon: HelpCircle },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?next=/admin")
  if (session.user.role !== "ADMIN") redirect("/")

  const [pendingOrders, unreadNotifications] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["PENDING", "PAID"] } } }),
    prisma.adminNotification.count({ where: { read: false } }),
  ])

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[16rem_1fr] min-h-[calc(100vh-4rem)]">
      <aside className="hidden lg:flex flex-col border-r bg-muted/20">
        <div className="p-6 border-b">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Admin
          </p>
          <p className="font-medium mt-1">{session.user.name ?? "Administrator"}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((link) => (
            <AdminLink key={link.href} {...link} badge={link.href === "/admin/orders" ? pendingOrders : undefined} />
          ))}
        </nav>
        <div className="p-4 border-t text-xs text-muted-foreground">
          <p>Shoply Admin v0.1.0</p>
        </div>
      </aside>

      <div className="flex flex-col min-w-0">
        <header className="sticky top-16 z-30 flex items-center justify-between gap-3 border-b bg-background/80 backdrop-blur px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{session.user.email}</span>
          </p>
          <AdminNotificationsBell initialCount={unreadNotifications} />
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  )
}

function AdminLink({
  href,
  label,
  icon: Icon,
  badge,
}: {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium",
        "hover:bg-muted transition-colors text-muted-foreground hover:text-foreground",
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
          {badge}
        </Badge>
      )}
    </Link>
  )
}
