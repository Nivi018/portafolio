'use client'

import { useEffect, useState } from 'react'
import type { AccountDto, CategoryDto, RecurringTransactionDto } from '@finance/shared'
import { CalendarClock, Plus } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { date, dateInputValue, money } from '@/lib/format'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringTransactionDto[]>([])
  const [accounts, setAccounts] = useState<AccountDto[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState('MONTHLY')
  const [nextDueDate, setNextDueDate] = useState(dateInputValue())
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState('')

  async function load() { const [recurring, accountData, categoryData] = await Promise.all([apiFetch<RecurringTransactionDto[]>('/recurring'), apiFetch<AccountDto[]>('/accounts'), apiFetch<CategoryDto[]>('/categories')]); setItems(recurring); setAccounts(accountData); setCategories(categoryData); setAccountId((value) => value || accountData[0]?.id || ''); setCategoryId((value) => value || categoryData.find((category) => category.type === type)?.id || '') }
  useEffect(() => { load().catch((cause: Error) => setError(cause.message)) }, [])
  const visibleCategories = categories.filter((category) => category.type === type)
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); try { await apiFetch('/recurring', { method: 'POST', body: JSON.stringify({ amount: Number(amount), description: description || undefined, type, frequency, nextDueDate, accountId, categoryId }) }); setAmount(''); setDescription(''); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo crear la recurrencia') } }

  return <>
    <PageHeader eyebrow="Automatización" title="Movimientos recurrentes" description="Programa lo predecible para que tu historial no dependa de memoria ni recordatorios." />
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]"><form onSubmit={submit} className="h-fit rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5"><div className="mb-5 flex items-center gap-2"><Plus size={17} className="text-[#5ee8b2]" /><h2 className="font-medium text-white">Nueva recurrencia</h2></div><div className="grid gap-3"><select value={type} onChange={(event) => { const next = event.target.value as 'EXPENSE' | 'INCOME'; setType(next); setCategoryId(categories.find((category) => category.type === next)?.id ?? '') }} className="rounded-xl border border-white/10 bg-[#162725] px-3 py-2.5 text-sm text-white"><option value="EXPENSE">Gasto</option><option value="INCOME">Ingreso</option></select><input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0.01" required placeholder="Monto" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5ee8b2]" /><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descripción" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5ee8b2]" /><select value={frequency} onChange={(event) => setFrequency(event.target.value)} className="rounded-xl border border-white/10 bg-[#162725] px-3 py-2.5 text-sm text-white"><option value="DAILY">Diario</option><option value="WEEKLY">Semanal</option><option value="MONTHLY">Mensual</option><option value="YEARLY">Anual</option></select><input value={nextDueDate} onChange={(event) => setNextDueDate(event.target.value)} type="date" required className="rounded-xl border border-white/10 bg-[#162725] px-3 py-2.5 text-sm text-white" /><select value={accountId} onChange={(event) => setAccountId(event.target.value)} className="rounded-xl border border-white/10 bg-[#162725] px-3 py-2.5 text-sm text-white">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="rounded-xl border border-white/10 bg-[#162725] px-3 py-2.5 text-sm text-white">{visibleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><button className="rounded-xl bg-[#5ee8b2] py-3 text-sm font-semibold text-[#0b1212]">Programar</button></div>{error && <p className="mt-3 rounded-xl bg-[#ff8374]/10 p-3 text-sm text-[#ffab9f]">{error}</p>}</form>
      <section className="grid gap-4">{items.length === 0 ? <EmptyState icon={CalendarClock} title="Nada programado" detail="Agrega gastos fijos o ingresos recurrentes." /> : items.map((item) => <article key={item.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5"><span className="grid size-11 place-items-center rounded-xl bg-white/5 text-[#5ee8b2]"><CalendarClock size={19} /></span><div className="min-w-0 flex-1"><p className="truncate font-medium text-white">{item.description ?? item.category.name}</p><p className="mt-1 text-sm text-[#8ca59e]">{item.frequency} · Próximo: {date(item.nextDueDate)} · {item.account.name}</p></div><p className={item.type === 'INCOME' ? 'font-semibold text-[#5ee8b2]' : 'font-semibold text-[#ffab9f]'}>{item.type === 'INCOME' ? '+' : '−'}{money(item.amount)}</p></article>)}</section></div>
  </>
}
