'use client'

import { useEffect, useState } from 'react'
import type { AccountDto, CategoryDto, PaginatedData, TransactionDto } from '@finance/shared'
import { Plus, ReceiptText, Trash2 } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { date, money } from '@/lib/format'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionDto[]>([])
  const [accounts, setAccounts] = useState<AccountDto[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  async function load() {
    const [transactionResult, accountResult, categoryResult] = await Promise.all([
      apiFetch<PaginatedData<TransactionDto>>('/transactions?limit=50'),
      apiFetch<AccountDto[]>('/accounts'),
      apiFetch<CategoryDto[]>('/categories'),
    ])
    setTransactions(transactionResult.items)
    setAccounts(accountResult)
    setCategories(categoryResult)
    setAccountId((current) => current || accountResult[0]?.id || '')
    setCategoryId((current) => current || categoryResult.find((item) => item.type === type)?.id || '')
  }

  useEffect(() => { load().catch((cause: Error) => setError(cause.message)).finally(() => setLoading(false)) }, [])

  const filteredCategories = categories.filter((category) => category.type === type)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)
    try {
      await apiFetch<TransactionDto>('/transactions', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount), description: description || undefined, type, accountId, categoryId }),
      })
      setAmount('')
      setDescription('')
      await load()
      setNotice('Movimiento guardado. Tu resumen ya incluye el cambio.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar el movimiento') } finally { setSaving(false) }
  }

  async function remove(id: string) {
    if (!window.confirm('¿Eliminar este movimiento?')) return
    setError('')
    setNotice('')
    setDeletingId(id)
    try {
      await apiFetch<void>(`/transactions/${id}`, { method: 'DELETE' })
      await load()
      setNotice('Movimiento eliminado.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el movimiento')
    } finally {
      setDeletingId(null)
    }
  }

  return <>
    <PageHeader eyebrow="Operación diaria" title="Movimientos" description="Registra el dinero cuando sucede. El historial se vuelve útil cuando es honesto." />
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <form onSubmit={submit} className="h-fit rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2"><Plus size={18} className="text-[#5ee8b2]" /><h2 className="font-medium text-white">Nuevo movimiento</h2></div>
        <div className="grid gap-4">
           <div role="group" aria-label="Tipo de movimiento" className="grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1"><button type="button" aria-pressed={type === 'EXPENSE'} onClick={() => { setType('EXPENSE'); setCategoryId(categories.find((item) => item.type === 'EXPENSE')?.id ?? '') }} className={`rounded-lg py-2 text-sm ${type === 'EXPENSE' ? 'bg-[#ff8374] font-medium text-[#0b1212]' : 'text-[#8ca59e]'}`}>Gasto</button><button type="button" aria-pressed={type === 'INCOME'} onClick={() => { setType('INCOME'); setCategoryId(categories.find((item) => item.type === 'INCOME')?.id ?? '') }} className={`rounded-lg py-2 text-sm ${type === 'INCOME' ? 'bg-[#5ee8b2] font-medium text-[#0b1212]' : 'text-[#8ca59e]'}`}>Ingreso</button></div>
          <label className="grid gap-2 text-sm text-[#a9c0b8]">Monto<input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0.01" step="0.01" required placeholder="0.00" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-[#5ee8b2]" /></label>
          <label className="grid gap-2 text-sm text-[#a9c0b8]">Descripción<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ej. Supermercado" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-[#5ee8b2]" /></label>
          <label className="grid gap-2 text-sm text-[#a9c0b8]">Cuenta<select value={accountId} onChange={(event) => setAccountId(event.target.value)} required className="rounded-xl border border-white/10 bg-[#162725] px-3 py-2.5 text-white outline-none focus:border-[#5ee8b2]">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
          <label className="grid gap-2 text-sm text-[#a9c0b8]">Categoría<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required className="rounded-xl border border-white/10 bg-[#162725] px-3 py-2.5 text-white outline-none focus:border-[#5ee8b2]">{filteredCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
           {error && <p role="alert" className="rounded-xl bg-[#ff8374]/10 p-3 text-sm text-[#ffab9f]">{error}</p>}
           {notice && <p aria-live="polite" className="rounded-xl bg-[#4ea5ff]/10 p-3 text-sm text-[#b9dcff]">{notice}</p>}
           <button disabled={saving || !accounts.length || !categories.length} className="rounded-xl bg-[#4ea5ff] py-3 text-sm font-semibold text-[#071c33] shadow-[0_8px_20px_rgba(78,165,255,0.18)] hover:bg-[#2377d4] disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar movimiento'}</button>
        </div>
      </form>
       <section className="rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-medium text-white">Historial reciente</h2><p className="mt-1 text-sm text-[#8ca59e]">Últimos 50 registros.</p></div><ReceiptText size={19} className="text-[#5ee8b2]" /></div>{loading ? <p aria-live="polite" className="py-12 text-center text-sm text-[#8ca59e]">Cargando movimientos...</p> : transactions.length === 0 ? <EmptyState icon={ReceiptText} title="Sin movimientos" detail="Agrega el primero desde el panel izquierdo." /> : <div className="grid divide-y divide-white/8">{transactions.map((transaction) => <div key={transaction.id} className="flex items-center gap-3 py-3.5"><div className="grid size-9 place-items-center rounded-xl bg-white/5 text-xs font-bold" style={{ color: transaction.category?.color ?? 'var(--accent)' }}>{transaction.type === 'INCOME' ? '+' : '−'}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{transaction.description ?? transaction.category?.name ?? 'Transferencia'}</p><p className="mt-1 text-xs text-[#8ca59e]">{transaction.category?.name ?? 'Transferencia'} · {transaction.account.name} · {date(transaction.date)}</p></div><span className={transaction.type === 'INCOME' ? 'text-[#5ee8b2] text-sm font-semibold' : 'text-sm font-semibold text-[#ffab9f]'}>{transaction.type === 'INCOME' ? '+' : '−'}{money(transaction.amount)}</span><button type="button" disabled={deletingId === transaction.id} onClick={() => remove(transaction.id)} className="ml-1 text-[#8ca59e] hover:text-[#ff8374] disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Eliminar ${transaction.description ?? transaction.category?.name ?? 'movimiento'}`}>{deletingId === transaction.id ? '…' : <Trash2 size={16} />}</button></div>)}</div>}</section>
    </div>
  </>
}
