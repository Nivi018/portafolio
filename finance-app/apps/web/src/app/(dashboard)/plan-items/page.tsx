'use client'

import { useEffect, useState } from 'react'
import type { AccountDto, CategoryDto, PlanItemDto } from '@finance/shared'
import { CalendarDays, Coins, Plus, Trash2 } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { money } from '@/lib/format'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'

const frequencies = [
  ['DAILY', 'Diario'],
  ['WEEKLY', 'Semanal'],
  ['BIWEEKLY', 'Quincenal'],
  ['MONTHLY', 'Mensual'],
  ['BIMONTHLY', 'Bimestral'],
  ['QUARTERLY', 'Trimestral'],
  ['SEMIANNUAL', 'Semestral'],
  ['YEARLY', 'Anual'],
] as const

const frequencyLabel: Record<PlanItemDto['frequency'], string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  BIMONTHLY: 'Bimestral',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  YEARLY: 'Anual',
}

export default function PlanItemsPage() {
  const [items, setItems] = useState<PlanItemDto[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [accounts, setAccounts] = useState<AccountDto[]>([])
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')
  const [frequency, setFrequency] = useState<(typeof frequencies)[number][0]>('MONTHLY')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [isFixed, setIsFixed] = useState(false)
  const [isMicroExpense, setIsMicroExpense] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const income = items.filter((item) => item.type === 'INCOME').reduce((sum, item) => sum + item.monthlyEquivalent, 0)
  const expense = items.filter((item) => item.type === 'EXPENSE').reduce((sum, item) => sum + item.monthlyEquivalent, 0)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [planItems, categoryData, accountData] = await Promise.all([
        apiFetch<PlanItemDto[]>('/plan-items'),
        apiFetch<CategoryDto[]>('/categories'),
        apiFetch<AccountDto[]>('/accounts'),
      ])
      setItems(planItems)
      setCategories(categoryData)
      setAccounts(accountData)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar tu planeación.')
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
      await apiFetch('/plan-items', {
        method: 'POST',
        body: JSON.stringify({
          name,
          amount: Number(amount),
          type,
          frequency,
          categoryId: categoryId || undefined,
          accountId: accountId || undefined,
          isFixed,
          isMicroExpense: type === 'EXPENSE' && isMicroExpense,
        }),
      })
      setName('')
      setAmount('')
      setCategoryId('')
      setAccountId('')
      setIsFixed(false)
      setIsMicroExpense(false)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la partida.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(item: PlanItemDto) {
    if (!window.confirm(`¿Eliminar “${item.name}” del plan?`)) return
    if (removingId) return
    setRemovingId(item.id)
    setError('')
    try {
      await apiFetch(`/plan-items/${item.id}`, { method: 'DELETE' })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar la partida.')
    } finally {
      setRemovingId(null)
    }
  }

  const categoryName = (id: string | null) => categories.find((category) => category.id === id)?.name
  const accountName = (id: string | null) => accounts.find((account) => account.id === id)?.name

  return (
    <>
      <PageHeader
        eyebrow="Planeación sin ruido"
        title="Plan mensual"
        description="Proyecta lo que esperas recibir y gastar. Este plan no mueve dinero ni altera tus saldos reales."
      />

      {error ? <div role="alert" className="mb-6 rounded-xl bg-[#ff8374]/10 p-4 text-sm text-[#ffab9f]"><p>{error}</p><button type="button" onClick={load} disabled={loading} className="mt-3 rounded-lg border border-[#ff8374]/40 px-3 py-2 font-semibold hover:bg-[#ff8374]/10 disabled:opacity-50">Reintentar</button></div> : null}

      <section aria-label="Resumen mensual proyectado" className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="ui-card p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8ca59e]">Ingreso previsto</p><p className="mt-2 text-2xl font-semibold text-[var(--accent)]">{money(income)}</p></div>
        <div className="ui-card p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8ca59e]">Gasto previsto</p><p className="mt-2 text-2xl font-semibold text-[#ff8374]">{money(expense)}</p></div>
        <div className="ui-card p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8ca59e]">Disponible estimado</p><p className={`mt-2 text-2xl font-semibold ${income - expense >= 0 ? 'text-white' : 'text-[#ff8374]'}`}>{money(income - expense)}</p></div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <form onSubmit={submit} className="ui-card h-fit p-5">
          <div className="mb-5 flex items-center gap-2"><Plus size={17} className="text-[var(--accent)]" /><h2 className="font-medium text-white">Nueva partida</h2></div>
          <div className="grid gap-3">
            <label className="grid gap-2 text-sm text-[#a9c0b8]">Nombre<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Renta, nómina o café" className="ui-field" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-[#a9c0b8]">Tipo<select value={type} onChange={(event) => setType(event.target.value as 'INCOME' | 'EXPENSE')} className="ui-field"><option value="EXPENSE">Gasto</option><option value="INCOME">Ingreso</option></select></label>
              <label className="grid gap-2 text-sm text-[#a9c0b8]">Monto<input required value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0.01" step="0.01" placeholder="0.00" className="ui-field" /></label>
            </div>
            <label className="grid gap-2 text-sm text-[#a9c0b8]">Frecuencia<select value={frequency} onChange={(event) => setFrequency(event.target.value as (typeof frequencies)[number][0])} className="ui-field">{frequencies.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-[#a9c0b8]">Categoría esperada<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="ui-field"><option value="">Sin categoría</option>{categories.filter((category) => category.type === type).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="grid gap-2 text-sm text-[#a9c0b8]">Cuenta esperada<select value={accountId} onChange={(event) => setAccountId(event.target.value)} className="ui-field"><option value="">Sin cuenta</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
            </div>
            <label className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-3 text-sm text-[#a9c0b8]"><input checked={isFixed} onChange={(event) => setIsFixed(event.target.checked)} type="checkbox" className="size-4 accent-[var(--accent)]" />Gasto o ingreso fijo</label>
            {type === 'EXPENSE' ? <label className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-3 text-sm text-[#a9c0b8]"><input checked={isMicroExpense} onChange={(event) => setIsMicroExpense(event.target.checked)} type="checkbox" className="size-4 accent-[var(--accent)]" />Gasto hormiga</label> : null}
            <button disabled={saving} aria-busy={saving} className="ui-button-primary mt-1 w-full">{saving ? 'Guardando…' : 'Agregar al plan'}</button>
          </div>
        </form>

        <section aria-busy={loading || removingId !== null}>
          {loading ? <p aria-live="polite" className="py-12 text-center text-sm text-[#8ca59e]">Calculando tu plan...</p> : items.length === 0 ? <EmptyState icon={CalendarDays} title="Tu plan empieza aquí" detail="Agrega tus ingresos y gastos esperados para ver tu disponible mensual." /> : <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101c1b]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-white/10 px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#8ca59e]"><span>Partida</span><span>Equivalente mensual</span></div>
            <div className="divide-y divide-white/10">{items.map((item) => <article key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-medium text-white">{item.name}</p>{item.isFixed ? <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-[#a9c0b8]">Fijo</span> : null}{item.isMicroExpense ? <span className="rounded-full bg-[#ff8374]/12 px-2 py-0.5 text-[10px] font-semibold text-[#ffab9f]">Hormiga</span> : null}</div><p className="mt-1 truncate text-xs text-[#8ca59e]">{frequencyLabel[item.frequency]} · {categoryName(item.categoryId) ?? 'Sin categoría'}{accountName(item.accountId) ? ` · ${accountName(item.accountId)}` : ''}</p></div><div className="flex items-center gap-3"><div className="text-right"><p className={item.type === 'INCOME' ? 'font-semibold text-[var(--accent)]' : 'font-semibold text-[#ff8374]'}>{item.type === 'INCOME' ? '+' : '-'}{money(item.monthlyEquivalent)}</p><p className="mt-1 text-xs text-[#8ca59e]">{money(item.amount)} / {frequencyLabel[item.frequency].toLowerCase()}</p></div><button type="button" aria-label={`Eliminar ${item.name}`} onClick={() => void remove(item)} className="grid size-11 place-items-center rounded-xl text-[#8ca59e] hover:bg-[#ff8374]/10 hover:text-[#ff8374]"><Trash2 size={16} /></button></div></article>)}</div>
          </div>}
          {items.length > 0 ? <p className="mt-3 flex items-center gap-2 text-xs text-[#8ca59e]"><Coins size={14} />Equivalencias calculadas por año calendario, sin aproximar semanas a cuatro ni días a treinta.</p> : null}
        </section>
      </div>
    </>
  )
}
