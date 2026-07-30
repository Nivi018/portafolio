'use client'

import { useEffect, useState } from 'react'
import type { DashboardDto } from '@finance/shared'
import { ArrowDownRight, ArrowUpRight, Landmark, PieChart, ReceiptText, Wallet } from 'lucide-react'
import { Cell, Pie, PieChart as RechartsPie, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts'
import { apiFetch } from '@/lib/api-client'
import { date, money, percentage } from '@/lib/format'
import { EmptyState } from '@/components/shared/empty-state'

function MetricCard({ label, value, change, positive, icon: Icon }: { label: string; value: string; change?: string; positive?: boolean; icon: typeof Wallet }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5">
      <div className="flex items-start justify-between"><span className="text-sm text-[#8ca59e]">{label}</span><span className="grid size-9 place-items-center rounded-xl bg-white/5 text-[#5ee8b2]"><Icon size={18} /></span></div>
      <p className="mt-5 text-2xl font-semibold tracking-tight text-white">{value}</p>
      {change && <p className={`mt-2 flex items-center gap-1 text-xs ${positive ? 'text-[#5ee8b2]' : 'text-[#ffab9f]'}`}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{change} vs. mes anterior</p>}
    </article>
  )
}

export function DashboardView() {
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadDashboard() {
    setLoading(true)
    setError('')
    try {
      setDashboard(await apiFetch<DashboardDto>('/dashboard'))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos cargar tu panorama financiero.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    apiFetch<DashboardDto>('/dashboard')
      .then((data) => { if (active) setDashboard(data) })
      .catch((cause: Error) => { if (active) setError(cause.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (error) return <div role="alert" className="rounded-2xl border border-[#ff8374]/30 bg-[#ff8374]/10 p-5 text-sm text-[#ffab9f]"><p>No pudimos cargar tu panorama.</p><p className="mt-1 text-[#ffb5ac]">{error}</p><button type="button" onClick={loadDashboard} className="mt-4 rounded-xl border border-[#ff8374]/40 px-3 py-2 text-sm font-semibold text-[#ffb5ac] hover:bg-[#ff8374]/10">Reintentar</button></div>
  if (loading || !dashboard) return <div aria-live="polite" className="grid min-h-96 place-items-center text-sm text-[#8ca59e]">Preparando tu panorama financiero...</div>

  const { summary } = dashboard
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Patrimonio disponible" value={money(summary.totalBalance)} icon={Wallet} />
        <MetricCard label="Ingresos del mes" value={money(summary.monthlyIncome)} change={percentage(summary.incomeChangePercent)} positive icon={ArrowUpRight} />
        <MetricCard label="Gastos del mes" value={money(summary.monthlyExpense)} change={percentage(summary.expenseChangePercent)} positive={false} icon={ArrowDownRight} />
        <MetricCard label="Flujo neto" value={money(summary.monthlyNet)} icon={Landmark} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
        <article className="min-h-[340px] rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5 sm:p-6">
          <div className="mb-5"><p className="font-medium text-white">Flujo de los últimos seis meses</p><p className="mt-1 text-sm text-[#8ca59e]">Ingresos y gastos para detectar tendencia, no solo saldo.</p></div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.monthlyFlow} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <defs><linearGradient id="income" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35}/><stop offset="100%" stopColor="var(--accent)" stopOpacity={0}/></linearGradient><linearGradient id="expense" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#ff8374" stopOpacity={0.2}/><stop offset="100%" stopColor="#ff8374" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#8ca59e', fontSize: 11 }} tickFormatter={(value) => value.slice(5)} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8ca59e', fontSize: 11 }} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip contentStyle={{ background: '#162725', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12 }} labelStyle={{ color: '#eefbf6' }} formatter={(value) => money(Number(value))} />
                <Area type="monotone" dataKey="income" stroke="var(--accent)" strokeWidth={2.5} fill="url(#income)" />
                <Area type="monotone" dataKey="expense" stroke="#ff8374" strokeWidth={2.5} fill="url(#expense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5 sm:p-6">
          <div className="mb-3"><p className="font-medium text-white">Dónde se fue el dinero</p><p className="mt-1 text-sm text-[#8ca59e]">Distribución de gastos del periodo.</p></div>
          {dashboard.expensesByCategory.length === 0 ? <EmptyState icon={PieChart} title="Aún no hay gastos" detail="Registra movimientos para ver la distribución." /> : <>
            <div className="h-44"><ResponsiveContainer width="100%" height="100%"><RechartsPie><Pie data={dashboard.expensesByCategory} dataKey="total" nameKey="categoryName" innerRadius={48} outerRadius={72} paddingAngle={4}>{dashboard.expensesByCategory.map((item) => <Cell key={item.categoryId} fill={item.color} />)}</Pie><Tooltip contentStyle={{ background: '#162725', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12 }} formatter={(value) => money(Number(value))} /></RechartsPie></ResponsiveContainer></div>
            <div className="mt-3 grid gap-2">{dashboard.expensesByCategory.slice(0, 4).map((item) => <div key={item.categoryId} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-[#a9c0b8]"><i className="size-2 rounded-full" style={{ background: item.color }} />{item.categoryName}</span><span className="font-medium text-white">{money(item.total)}</span></div>)}</div>
          </>}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><div><p className="font-medium text-white">Actividad reciente</p><p className="mt-1 text-sm text-[#8ca59e]">Últimos movimientos registrados.</p></div><ReceiptText size={18} className="text-[#5ee8b2]" /></div>
          <div className="grid divide-y divide-white/8">{dashboard.recentTransactions.length === 0 ? <EmptyState icon={ReceiptText} title="Sin movimientos todavía" detail="Tu actividad aparecerá aquí." /> : dashboard.recentTransactions.map((transaction) => <div key={transaction.id} className="flex items-center justify-between gap-3 py-3.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{transaction.description ?? transaction.category?.name ?? 'Transferencia'}</p><p className="mt-1 text-xs text-[#8ca59e]">{transaction.account.name} · {date(transaction.date)}</p></div><span className={transaction.type === 'INCOME' ? 'text-sm font-semibold text-[#5ee8b2]' : 'text-sm font-semibold text-[#ffab9f]'}>{transaction.type === 'INCOME' ? '+' : '-'}{money(transaction.amount)}</span></div>)}</div>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5 sm:p-6"><p className="font-medium text-white">Pulso de presupuestos</p><p className="mt-1 text-sm text-[#8ca59e]">Controla antes de que el mes se cierre.</p><div className="mt-5 grid gap-4">{dashboard.budgetStatuses.length === 0 ? <p className="text-sm text-[#8ca59e]">Aún no definiste presupuestos.</p> : dashboard.budgetStatuses.slice(0, 4).map((budget) => <div key={budget.id}><div className="mb-2 flex justify-between gap-3 text-sm"><span className="truncate text-[#a9c0b8]">{budget.category?.name ?? 'Gasto total'}</span><span className={budget.isOverBudget ? 'text-[#ff8374]' : 'text-white'}>{budget.percentage.toFixed(0)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/8"><div className={`h-full rounded-full ${budget.isOverBudget ? 'bg-[#ff8374]' : 'bg-[#5ee8b2]'}`} style={{ width: `${Math.min(budget.percentage, 100)}%` }} /></div></div>)}</div></article>
      </section>
    </div>
  )
}
