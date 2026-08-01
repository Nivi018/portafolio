'use client'

import { useEffect, useState } from 'react'
import type { CategoryDto, PlanVsActualDto, PlanVsActualMonthDto } from '@finance/shared'
import { AlertTriangle, CalendarDays, ChartNoAxesCombined, TrendingDown, TrendingUp } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { dateInputValue, money } from '@/lib/format'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'

type PeriodMode = 'MONTH' | 'YEAR'
type Comparison = PlanVsActualDto & { period: { from: string; to: string } }

const monthLabel = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' })

function rangeFor(mode: PeriodMode, value: string) {
  if (mode === 'YEAR') return { from: `${value}-01-01`, to: `${value}-12-31` }
  const [yearPart, monthPart] = value.split('-')
  const year = Number(yearPart)
  const month = Number(monthPart)
  return { from: `${value}-01`, to: dateInputValue(new Date(year, month, 0)) }
}

export default function PlanVsActualPage() {
  const now = new Date()
  const [mode, setMode] = useState<PeriodMode>('MONTH')
  const [month, setMonth] = useState(dateInputValue(now).slice(0, 7))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [report, setReport] = useState<Comparison | null>(null)
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    const range = rangeFor(mode, mode === 'MONTH' ? month : year)
    setLoading(true)
    setError('')
    try {
      const [comparison, categoryData] = await Promise.all([
        apiFetch<Comparison>(`/reports/plan-vs-actual?from=${range.from}&to=${range.to}`),
        apiFetch<CategoryDto[]>('/categories'),
      ])
      setReport(comparison)
      setCategories(categoryData)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo calcular la comparación.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const activeMonth = report?.months[0]
  const categoryName = (id: string | null) => categories.find((category) => category.id === id)?.name ?? 'Sin categoría'
  const varianceTone = (value: number) => value >= 0 ? 'text-[var(--accent)]' : 'text-[#ff8374]'

  return <>
    <PageHeader eyebrow="Decidir con evidencia" title="Plan vs. real" description="Compara el plan vigente con los movimientos registrados. El plan se aplica igual a cada mes del periodo." action={<div className="flex items-center gap-2 text-sm text-[#8ca59e]"><ChartNoAxesCombined size={16} /> Comparativo</div>} />

    <section className="ui-card mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
      <div className="flex rounded-xl border border-white/10 p-1">
        {(['MONTH', 'YEAR'] as const).map((value) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${mode === value ? 'bg-finance-accent text-[var(--accent-ink)]' : 'text-finance-muted hover:text-finance-text'}`}>{value === 'MONTH' ? 'Mensual' : 'Anual'}</button>)}
      </div>
      <label className="grid flex-1 gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8ca59e]">{mode === 'MONTH' ? 'Mes' : 'Año'}<input value={mode === 'MONTH' ? month : year} onChange={(event) => mode === 'MONTH' ? setMonth(event.target.value) : setYear(event.target.value)} type={mode === 'MONTH' ? 'month' : 'number'} min="2020" max="2100" className="ui-field font-normal normal-case tracking-normal" /></label>
      <button type="button" onClick={() => void load()} disabled={loading} aria-busy={loading} className="ui-button-primary min-h-11 px-5">{loading ? 'Actualizando…' : 'Comparar'}</button>
    </section>

    {error ? <div role="alert" className="mb-6 rounded-xl bg-finance-danger/10 p-4 text-sm text-[#ffab9f]"><p>{error}</p><button type="button" onClick={() => void load()} disabled={loading} className="mt-3 rounded-lg border border-finance-danger/40 px-3 py-2 font-semibold disabled:opacity-50">Reintentar</button></div> : null}
    {loading || !report ? <p aria-live="polite" className="py-16 text-center text-sm text-[#8ca59e]">Comparando plan y movimientos...</p> : <>
      <section aria-label="Totales del periodo" className="mb-6 grid gap-3 sm:grid-cols-3">
        <article className="ui-card p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8ca59e]">Ingreso</p><div className="mt-2 flex items-baseline justify-between gap-3"><p className="text-2xl font-semibold text-[var(--accent)]">{money(report.actualIncome)}</p><span className="text-xs text-[#8ca59e]">plan {money(report.plannedIncome)}</span></div></article>
        <article className="ui-card p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8ca59e]">Gasto</p><div className="mt-2 flex items-baseline justify-between gap-3"><p className="text-2xl font-semibold text-[#ff8374]">{money(report.actualExpense)}</p><span className="text-xs text-[#8ca59e]">plan {money(report.plannedExpense)}</span></div></article>
        <article className="ui-card p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8ca59e]">Disponible real</p><div className="mt-2 flex items-center justify-between gap-3"><p className="text-2xl font-semibold text-white">{money(report.actualNet)}</p><span className={`flex items-center gap-1 text-xs font-semibold ${varianceTone(report.variance)}`}>{report.variance >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{report.variance >= 0 ? '+' : ''}{money(report.variance)}</span></div><p className="mt-1 text-xs text-[#8ca59e]">vs. {money(report.plannedNet)} proyectado</p></article>
      </section>

      {mode === 'YEAR' ? <AnnualRows months={report.months} varianceTone={varianceTone} /> : <CategoryRows month={activeMonth} categoryName={categoryName} />}
    </>}
  </>
}

function AnnualRows({ months, varianceTone }: { months: PlanVsActualMonthDto[]; varianceTone: (value: number) => string }) {
  return <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101c1b]"><div className="grid grid-cols-[minmax(100px,1fr)_minmax(80px,auto)_minmax(80px,auto)_minmax(80px,auto)] gap-3 border-b border-white/10 px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#8ca59e]"><span>Mes</span><span className="text-right">Plan neto</span><span className="text-right">Real</span><span className="text-right">Desviación</span></div><div className="divide-y divide-white/10">{months.map((item) => <article key={item.month} className="grid grid-cols-[minmax(100px,1fr)_minmax(80px,auto)_minmax(80px,auto)_minmax(80px,auto)] items-center gap-3 px-5 py-4 text-sm"><p className="capitalize text-white">{monthLabel.format(new Date(`${item.month}-01T12:00:00`))}</p><p className="text-right text-[#8ca59e]">{money(item.plannedNet)}</p><p className="text-right font-medium text-white">{money(item.actualNet)}</p><p className={`text-right font-semibold ${varianceTone(item.variance)}`}>{item.variance >= 0 ? '+' : ''}{money(item.variance)}</p></article>)}</div></section>
}

function CategoryRows({ month, categoryName }: { month: PlanVsActualMonthDto | undefined; categoryName: (id: string | null) => string }) {
  if (!month || month.categories.length === 0) return <EmptyState icon={CalendarDays} title="Sin datos para comparar" detail="Agrega una partida planificada o registra un movimiento en este mes." />
  return <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101c1b]"><div className="border-b border-white/10 px-5 py-4"><p className="font-medium text-white">Desviación por categoría</p><p className="mt-1 text-sm text-[#8ca59e]">Los gastos al 80% del plan requieren atención; al 100% se marcan como excedidos.</p></div><div className="divide-y divide-white/10">{month.categories.map((item) => { const ratio = item.planned ? item.actual / item.planned : 0; const status = item.type === 'EXPENSE' && item.actual > 0 && !item.planned ? 'Sin plan' : item.type === 'EXPENSE' && ratio >= 1 ? 'Excedido' : item.type === 'EXPENSE' && ratio >= 0.8 ? 'Atención' : null; return <article key={`${item.type}-${item.categoryId ?? 'none'}`} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-white">{categoryName(item.categoryId)}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.type === 'INCOME' ? 'bg-[#4ea5ff]/12 text-[#4ea5ff]' : 'bg-[#ff8374]/12 text-[#ffab9f]'}`}>{item.type === 'INCOME' ? 'Ingreso' : 'Gasto'}</span>{status ? <span className="flex items-center gap-1 text-xs font-semibold text-[#ffab9f]"><AlertTriangle size={13} />{status}</span> : null}</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><div className={item.type === 'EXPENSE' && ratio >= 1 ? 'h-full bg-[#ff8374]' : 'h-full bg-[#4ea5ff]'} style={{ width: `${Math.min(ratio * 100, 100)}%` }} /></div></div><p className="text-sm text-[#8ca59e]">Plan<br /><span className="font-medium text-white">{money(item.planned)}</span></p><p className="text-sm text-[#8ca59e]">Real<br /><span className="font-medium text-white">{money(item.actual)}</span></p><p className={`text-sm font-semibold ${item.variance <= 0 && item.type === 'EXPENSE' ? 'text-[var(--accent)]' : item.variance > 0 && item.type === 'EXPENSE' ? 'text-[#ff8374]' : 'text-white'}`}>{item.variance >= 0 ? '+' : ''}{money(item.variance)}</p></article> })}</div></section>
}
