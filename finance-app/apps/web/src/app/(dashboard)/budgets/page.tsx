'use client'

import { useEffect, useState } from 'react'
import type { BudgetStatusDto, CategoryDto } from '@finance/shared'
import { AlertTriangle, PiggyBank, Plus } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { money } from '@/lib/format'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { ProgressBar } from '@/components/shared/progress-bar'

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetStatusDto[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [period, setPeriod] = useState('MONTHLY')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [budgetData, categoryData] = await Promise.all([
        apiFetch<BudgetStatusDto[]>('/budgets'),
        apiFetch<CategoryDto[]>('/categories?type=EXPENSE'),
      ])
      setBudgets(budgetData)
      setCategories(categoryData)
      setCategoryId((value) => value || categoryData[0]?.id || '')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los presupuestos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiFetch('/budgets', { method: 'POST', body: JSON.stringify({ amount: Number(amount), period, categoryId: categoryId || undefined }) })
      setAmount('')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el presupuesto.')
    } finally {
      setSaving(false)
    }
  }

  return <>
    <PageHeader eyebrow="Límites con intención" title="Presupuestos" description="Convierte tus prioridades en límites visibles antes de que el gasto se descontrole." />
    {error && <div role="alert" className="mb-6 rounded-xl bg-[#ff8374]/10 p-4 text-sm text-[#ffab9f]"><p>{error}</p><button type="button" onClick={load} disabled={loading} className="mt-3 rounded-lg border border-[#ff8374]/40 px-3 py-2 font-semibold hover:bg-[#ff8374]/10 disabled:opacity-50">Reintentar</button></div>}
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
      <form onSubmit={submit} className="ui-card h-fit p-5"><div className="mb-5 flex items-center gap-2"><Plus size={17} className="text-[var(--accent)]" /><h2 className="font-medium text-white">Nuevo presupuesto</h2></div><div className="grid gap-3"><label className="grid gap-2 text-sm text-[#a9c0b8]">Categoría<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="ui-field">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="grid gap-2 text-sm text-[#a9c0b8]">Monto<input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" step="0.01" required placeholder="0.00" className="ui-field" /></label><label className="grid gap-2 text-sm text-[#a9c0b8]">Periodo<select value={period} onChange={(event) => setPeriod(event.target.value)} className="ui-field"><option value="WEEKLY">Semanal</option><option value="MONTHLY">Mensual</option><option value="YEARLY">Anual</option></select></label><button disabled={saving || !categories.length} aria-busy={saving} className="ui-button-primary w-full">{saving ? 'Guardando…' : 'Definir límite'}</button></div></form>
      <section aria-busy={loading} className="grid gap-4">{loading ? <p aria-live="polite" className="py-12 text-center text-sm text-[#8ca59e]">Cargando presupuestos...</p> : budgets.length === 0 ? <EmptyState icon={PiggyBank} title="Sin presupuestos aún" detail="Define uno para empezar a comparar plan contra realidad." /> : budgets.map((budget) => <article key={budget.id} className="ui-card p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{budget.category?.name ?? 'Gasto total'}</p><p className="mt-1 text-xs uppercase tracking-wider text-[#8ca59e]">{budget.period}</p></div>{budget.isOverBudget && <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#ff8374]"><AlertTriangle size={14} /> Excedido</span>}</div><div className="mt-6 flex items-end justify-between"><div><p className="text-2xl font-semibold text-white">{money(budget.spent)}</p><p className="mt-1 text-xs text-[#8ca59e]">de {money(budget.amount)}</p></div><p className={budget.isOverBudget ? 'text-right text-lg font-semibold text-[#ff8374]' : 'text-right text-lg font-semibold text-[var(--accent)]'}>{money(budget.remaining)} {budget.isOverBudget ? 'excedido' : 'restante'}</p></div><div className="mt-4"><ProgressBar label={`Presupuesto ${budget.category?.name ?? 'Gasto total'}`} value={budget.percentage} tone={budget.isOverBudget ? 'danger' : 'accent'} /></div><p className="mt-2 text-right text-xs text-[#8ca59e]">{budget.percentage.toFixed(1)}% utilizado</p></article>)}</section>
    </div>
  </>
}
