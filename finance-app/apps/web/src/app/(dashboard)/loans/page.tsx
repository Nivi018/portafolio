'use client'

import { useEffect, useState } from 'react'
import type { AccountDto, CategoryDto, LoanWithProgressDto } from '@finance/shared'
import { HandCoins, Plus } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { dateInputValue, money } from '@/lib/format'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { ProgressBar } from '@/components/shared/progress-bar'

const initialForm = () => ({ lender: '', name: '', originalPrincipal: '', annualRate: '', termMonths: '', monthlyPayment: '', startDate: dateInputValue(), nextPaymentDate: dateInputValue() })

export default function LoansPage() {
  const [loans, setLoans] = useState<LoanWithProgressDto[]>([])
  const [accounts, setAccounts] = useState<AccountDto[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [form, setForm] = useState(initialForm)
  const [payments, setPayments] = useState<Record<string, string>>({})
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [payingLoanId, setPayingLoanId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [loanData, accountData, categoryData] = await Promise.all([apiFetch<LoanWithProgressDto[]>('/loans'), apiFetch<AccountDto[]>('/accounts'), apiFetch<CategoryDto[]>('/categories?type=EXPENSE')])
      setLoans(loanData)
      setAccounts(accountData)
      setCategories(categoryData)
      setAccountId((value) => value || accountData[0]?.id || '')
      setCategoryId((value) => value || categoryData[0]?.id || '')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los préstamos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])
  const change = (key: keyof ReturnType<typeof initialForm>, value: string) => setForm((current) => ({ ...current, [key]: value }))

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await apiFetch('/loans', { method: 'POST', body: JSON.stringify({ ...form, originalPrincipal: Number(form.originalPrincipal), annualRate: Number(form.annualRate), termMonths: Number(form.termMonths), monthlyPayment: Number(form.monthlyPayment) }) })
      setForm(initialForm())
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el préstamo.')
    } finally {
      setSaving(false)
    }
  }

  async function pay(loan: LoanWithProgressDto) {
    const amount = Number(payments[loan.id])
    if (!amount || !accountId || !categoryId) return setError('Elige cuenta, categoría y monto para registrar el pago.')
    if (payingLoanId) return
    setPayingLoanId(loan.id)
    setError('')
    try {
      await apiFetch(`/loans/${loan.id}/payments`, { method: 'POST', body: JSON.stringify({ amount, date: dateInputValue(), accountId, categoryId }) })
      setPayments((current) => ({ ...current, [loan.id]: '' }))
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar el pago.')
    } finally {
      setPayingLoanId(null)
    }
  }

  return <>
    <PageHeader eyebrow="Deuda con contexto" title="Préstamos" description="Registra tus compromisos, pagos reales y el avance de cada saldo." />
    {error ? <div role="alert" className="mb-6 rounded-xl bg-finance-danger/10 p-4 text-sm text-[#ffab9f]"><p>{error}</p><button type="button" onClick={() => void load()} disabled={loading} className="mt-3 rounded-lg border border-finance-danger/40 px-3 py-2 font-semibold disabled:opacity-50">Reintentar</button></div> : null}
    <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <form onSubmit={create} aria-busy={saving} className="ui-card h-fit p-5">
        <div className="mb-4 flex items-center gap-2"><Plus size={17} className="text-finance-accent" /><h2 className="font-medium text-finance-text">Nuevo préstamo</h2></div>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm text-finance-muted">Prestamista<input required value={form.lender} onChange={(event) => change('lender', event.target.value)} className="ui-field" /></label>
          <label className="grid gap-1 text-sm text-finance-muted">Nombre del préstamo<input required value={form.name} onChange={(event) => change('name', event.target.value)} className="ui-field" /></label>
          <label className="grid gap-1 text-sm text-finance-muted">Capital inicial<input required value={form.originalPrincipal} onChange={(event) => change('originalPrincipal', event.target.value)} type="number" min="0.01" step="0.01" className="ui-field" /></label>
          <label className="grid gap-1 text-sm text-finance-muted">Tasa anual (%)<input required value={form.annualRate} onChange={(event) => change('annualRate', event.target.value)} type="number" min="0" step="0.01" className="ui-field" /></label>
          <label className="grid gap-1 text-sm text-finance-muted">Plazo (meses)<input required value={form.termMonths} onChange={(event) => change('termMonths', event.target.value)} type="number" min="1" step="1" className="ui-field" /></label>
          <label className="grid gap-1 text-sm text-finance-muted">Pago mensual<input required value={form.monthlyPayment} onChange={(event) => change('monthlyPayment', event.target.value)} type="number" min="0.01" step="0.01" className="ui-field" /></label>
          <label className="grid gap-1 text-sm text-finance-muted">Inicio<input required value={form.startDate} onChange={(event) => change('startDate', event.target.value)} type="date" className="ui-field" /></label>
          <label className="grid gap-1 text-sm text-finance-muted">Próximo pago<input required value={form.nextPaymentDate} onChange={(event) => change('nextPaymentDate', event.target.value)} type="date" className="ui-field" /></label>
          <button disabled={saving} aria-busy={saving} className="ui-button-primary">{saving ? 'Guardando...' : 'Agregar préstamo'}</button>
        </div>
      </form>
      <section aria-busy={loading} className="grid min-w-0 gap-4">
        {loading ? <p aria-live="polite" className="py-12 text-center text-sm text-finance-muted">Cargando préstamos...</p> : loans.length === 0 ? <EmptyState icon={HandCoins} title="Sin préstamos registrados" detail="Agrega uno para seguir su saldo y pagos." /> : loans.map((loan) => <article key={loan.id} className="ui-card min-w-0 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-finance-text">{loan.name}</p><p className="mt-1 text-sm text-finance-muted">{loan.lender}</p></div><p className="text-right text-lg font-semibold text-finance-text">{money(loan.currentBalance)}</p></div><div className="mt-5"><ProgressBar label={`Avance de ${loan.name}`} value={loan.progressPercentage} tone="accent" /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm text-finance-muted">Monto del pago<input aria-label={`Monto del pago para ${loan.name}`} value={payments[loan.id] ?? ''} onChange={(event) => setPayments((current) => ({ ...current, [loan.id]: event.target.value }))} type="number" min="0.01" step="0.01" className="ui-field" /></label><div className="grid gap-2 sm:grid-cols-2"><label className="grid gap-1 text-sm text-finance-muted">Cuenta<select value={accountId} onChange={(event) => setAccountId(event.target.value)} className="ui-field">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label className="grid gap-1 text-sm text-finance-muted">Categoría<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="ui-field">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div></div><button type="button" onClick={() => void pay(loan)} disabled={payingLoanId !== null} aria-busy={payingLoanId === loan.id} className="ui-button-primary mt-3">{payingLoanId === loan.id ? 'Registrando...' : 'Registrar pago'}</button></article>)}</section>
    </div>
  </>
}
