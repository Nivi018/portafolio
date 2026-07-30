"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  Users,
  Briefcase,
  BarChart3,
  Clock,
  Scissors,
  User,
  Shield,
  DollarSign,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_BASE_PATH: Record<string, string> = {
  CLIENT: "client",
  BUSINESS_OWNER: "business",
  SUPER_ADMIN: "admin",
};

const navByRole: Record<string, NavItem[]> = {
  CLIENT: [
    { href: "/dashboard/client", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/client/appointments", label: "Mis reservas", icon: Calendar },
    { href: "/dashboard/client/profile", label: "Mi perfil", icon: User },
    { href: "/dashboard/client/settings", label: "Configuración", icon: Settings },
  ],
  BUSINESS_OWNER: [
    { href: "/dashboard/business", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/business/appointments", label: "Reservas", icon: Calendar },
    { href: "/dashboard/business/calendar", label: "Calendario", icon: Clock },
    { href: "/dashboard/business/services", label: "Servicios", icon: Briefcase },
    { href: "/dashboard/business/schedule", label: "Horarios", icon: Scissors },
    { href: "/dashboard/business/payments", label: "Pagos", icon: DollarSign },
    { href: "/dashboard/business/settings", label: "Configuración", icon: Settings },
  ],
  SUPER_ADMIN: [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/businesses", label: "Negocios", icon: Briefcase },
    { href: "/dashboard/admin/users", label: "Usuarios", icon: Users },
    { href: "/dashboard/admin/settings", label: "Configuración", icon: Shield },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "CLIENT";
  const navItems = navByRole[role] || navByRole.CLIENT;
  const basePath = ROLE_BASE_PATH[role] || "client";
  const dashboardPath = `/dashboard/${basePath}`;

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-muted/30">
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== dashboardPath && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
