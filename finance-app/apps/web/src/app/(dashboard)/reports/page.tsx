'use client'

import { useEffect, useState } from 'react'
import type { IncomeExpenseReportDto } from '@finance/shared'
import { BarChart3, CalendarDays } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { apiFetch } from '@/lib/api-client'
import { dateInputValue, money } from '@/lib/format'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'

export default function ReportsPage() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const [from, setFrom] = useState(dateInputValue(firstDay))
  const [to, setTo] = useState(dateInputValue(today))
  const [report, setReport] = useState<IncomeExpenseReportDto | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    if (from > to) {
      setError('La fecha inicial debe ser anterior o igual a la fecha final.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setReport(await apiFetch<IncomeExpenseReportDto>(`/reports/income-expense?from=${from}&to=${to}`))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el reporte')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  return <>
    <PageHeader eyebrow="Lectura estratégica" title="Reportes" description="Elige un periodo y observa los patrones que no se ven en un solo movimiento." action={<div className="flex items-center gap-2 text-sm text-[#8ca59e]"><CalendarDays size={16} /> Periodo personalizado</div>} />
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#101c1b]/80 p-4 sm:flex-row sm:items-end"><label className="grid flex-1 gap-2 text-xs uppercase tracking-wider text-[#8ca59e]">Desde<input value={from} onChange={(event) => setFrom(event.target.value)} max={to} type="date" className="rounded-xl border border-white/10 bg-[#162725] px-3 py-2.5 text-sm normal-case tracking-normal text-white" /></label><label className="grid flex-1 gap-2 text-xs uppercase tracking-wider text-[#8ca59e]">Hasta<input value={to} onChange={(event) => setTo(event.target.value)} min={from} type="date" className="rounded-xl border border-white/10 bg-[#162725] px-3 py-2.5 text-sm normal-case tracking-normal text-white" /></label><button type="button" onClick={load} disabled={loading} aria-busy={loading} className="rounded-xl bg-[#5ee8b2] px-5 py-2.5 text-sm font-semibold text-[#0b1212] disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Actualizando…' : 'Actualizar'}</button></div>
    {error ? <div className="rounded-xl bg-[#ff8374]/10 p-4 text-sm text-[#ffab9f]">{error}</div> : !report ? <p className="py-20 text-center text-sm text-[#8ca59e]">Generando reporte...</p> : <div className="grid gap-6"><section className="grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5"><p className="text-sm text-[#8ca59e]">Ingresos</p><p className="mt-3 text-2xl font-semibold text-[#5ee8b2]">{money(report.totalIncome)}</p></article><article className="rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5"><p className="text-sm text-[#8ca59e]">Gastos</p><p className="mt-3 text-2xl font-semibold text-[#ff8374]">{money(report.totalExpense)}</p></article><article className="rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5"><p className="text-sm text-[#8ca59e]">Resultado neto</p><p className="mt-3 text-2xl font-semibold text-white">{money(report.netBalance)}</p></article></section><section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]"><article className="min-h-80 rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5"><div className="mb-4"><p className="font-medium text-white">Gastos por categoría</p><p className="mt-1 text-sm text-[#8ca59e]">Concentración del gasto seleccionado.</p></div>{report.expensesByCategory.length === 0 ? <EmptyState icon={BarChart3} title="Sin gastos en el periodo" detail="Cambia el rango o registra movimientos." /> : <div className="h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={report.expensesByCategory} dataKey="total" nameKey="categoryName" innerRadius={58} outerRadius={88}>{report.expensesByCategory.map((item) => <Cell key={item.categoryId} fill={item.color} />)}</Pie><Tooltip contentStyle={{ background: '#162725', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12 }} formatter={(value) => money(Number(value))} /></PieChart></ResponsiveContainer></div>}</article><article className="rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5"><p className="font-medium text-white">Detalle por categoría</p><div className="mt-5 grid divide-y divide-white/8">{report.expensesByCategory.map((item) => <div key={item.categoryId} className="flex items-center justify-between py-3"><span className="flex items-center gap-2 text-sm text-[#a9c0b8]"><i className="size-2 rounded-full" style={{ background: item.color }} />{item.categoryName}</span><span className="text-sm font-medium text-white">{money(item.total)} <small className="text-[#8ca59e]">{item.percentage.toFixed(0)}%</small></span></div>)}</div></article></section></div>}
  </>
}
