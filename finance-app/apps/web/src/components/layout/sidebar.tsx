'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  CalendarClock,
  CreditCard,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Target,
  WalletCards,
} from 'lucide-react'

const navigation = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/transactions', label: 'Movimientos', icon: ReceiptText },
  { href: '/accounts', label: 'Cuentas', icon: WalletCards },
  { href: '/budgets', label: 'Presupuestos', icon: PiggyBank },
  { href: '/goals', label: 'Metas', icon: Target },
  { href: '/recurring', label: 'Recurrentes', icon: CalendarClock },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-white/10 bg-[#101c1b]/95 px-4 py-6 lg:flex">
        <Link href="/dashboard" className="mb-10 flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-[#5ee8b2] text-lg font-black text-[#0b1212]">N</span>
          <span>
            <strong className="block text-sm tracking-[0.18em] text-white">NEXA</strong>
            <span className="text-xs text-[#8ca59e]">personal finance</span>
          </span>
        </Link>
        <nav className="grid gap-1">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? 'bg-[#4ea5ff] font-semibold text-[#071c33] shadow-[0_8px_20px_rgba(78,165,255,0.18)]'
                    : 'text-[#a9c0b8] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-[#5ee8b2]/20 bg-[#5ee8b2]/8 p-4">
          <CreditCard size={18} className="mb-3 text-[#5ee8b2]" />
          <p className="text-sm font-semibold text-white">Tu dinero, en contexto.</p>
          <p className="mt-1 text-xs leading-5 text-[#8ca59e]">Registra, compara y decide con claridad.</p>
        </div>
      </aside>
      <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-30 flex gap-1 overflow-x-auto border-t border-white/10 bg-[#101c1b]/95 px-2 py-2 backdrop-blur lg:hidden">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-16 shrink-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] transition ${active ? 'bg-[#4ea5ff]/12 text-[#4ea5ff]' : 'text-[#8ca59e] hover:bg-white/5 hover:text-white'}`}
            >
              <Icon size={18} />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
