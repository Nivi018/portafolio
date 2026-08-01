'use client'

import { useEffect, useState } from 'react'
import type { AccountDto, CreditCardSummaryDto } from '@finance/shared'
import { AlertTriangle, CalendarDays, CreditCard, Plus, WalletCards } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { money } from '@/lib/format'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { ProgressBar } from '@/components/shared/progress-bar'

const alertCopy = {
  NONE: 'Uso saludable',
  ATTENTION: 'Revisa tu utilización',
  HIGH: 'Utilización alta',
  OVER_LIMIT: 'Límite excedido',
} as const

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCardSummaryDto[]>([])
  const [accounts, setAccounts] = useState<AccountDto[]>([])
  const [accountId, setAccountId] = useState('')
  const [bank, setBank] = useState('')
  const [product, setProduct] = useState('')
  const [creditLimit, setCreditLimit] = useState('')
  const [apr, setApr] = useState('')
  const [statementCloseDay, setStatementCloseDay] = useState('')
  const [paymentDueDay, setPaymentDueDay] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const unconfigured = accounts.filter((account) => account.type === 'CREDIT' && !cards.some((card) => card.accountId === account.id))

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [cardData, accountData] = await Promise.all([
        apiFetch<CreditCardSummaryDto[]>('/credit-cards'),
        apiFetch<AccountDto[]>('/accounts'),
      ])
      setCards(cardData)
      setAccounts(accountData)
      setAccountId((value) => value || accountData.find((account) => account.type === 'CREDIT' && !cardData.some((card) => card.accountId === account.id))?.id || '')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las tarjetas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await apiFetch('/credit-cards', {
        method: 'POST',
        body: JSON.stringify({ accountId, bank, product, creditLimit: Number(creditLimit), apr: Number(apr), statementCloseDay: Number(statementCloseDay), paymentDueDay: Number(paymentDueDay) }),
      })
      setBank('')
      setProduct('')
      setCreditLimit('')
      setApr('')
      setStatementCloseDay('')
      setPaymentDueDay('')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo configurar la tarjeta.')
    } finally {
      setSaving(false)
    }
  }

  return <>
    <PageHeader eyebrow="Crédito bajo control" title="Tarjetas" description="Configura tus líneas de crédito para ver deuda, disponibilidad y fechas clave sin alterar tus movimientos." />
    {error ? <div role="alert" className="mb-6 rounded-xl bg-finance-danger/10 p-4 text-sm text-[#ffab9f]"><p>{error}</p><button type="button" onClick={() => void load()} disabled={loading} className="mt-3 rounded-lg border border-finance-danger/40 px-3 py-2 font-semibold disabled:opacity-50">Reintentar</button></div> : null}
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <section aria-busy={loading} className="grid gap-4 sm:grid-cols-2">
        {loading ? <p aria-live="polite" className="col-span-full py-12 text-center text-sm text-[#8ca59e]">Cargando tarjetas...</p> : cards.length === 0 ? <div className="col-span-full"><EmptyState icon={CreditCard} title="Sin tarjetas configuradas" detail="Crea una cuenta de crédito y configura aquí su límite y fechas." /></div> : cards.map((card) => <article key={card.id} className="ui-card overflow-hidden p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8ca59e]">{card.bank}</p><h2 className="mt-1 font-medium text-white">{card.product}</h2><p className="mt-1 text-xs text-[#8ca59e]">{card.accountName}</p></div><CreditCard size={20} className="text-[var(--accent)]" /></div><div className="mt-7 grid grid-cols-2 gap-4"><div><p className="text-xs text-[#8ca59e]">Deuda actual</p><p className="mt-1 text-xl font-semibold text-[#ff8374]">{money(card.debt, card.currency)}</p></div><div><p className="text-xs text-[#8ca59e]">Disponible</p><p className="mt-1 text-xl font-semibold text-[var(--accent)]">{money(card.availableCredit, card.currency)}</p></div></div><div className="mt-6"><ProgressBar label={`Utilización ${card.product}`} value={Math.min(card.utilization, 100)} tone={card.utilizationAlert === 'NONE' ? 'accent' : 'danger'} /></div><div className="mt-2 flex items-center justify-between text-xs"><span className={card.utilizationAlert === 'NONE' ? 'text-[#8ca59e]' : 'flex items-center gap-1 text-[#ffab9f]'}>{card.utilizationAlert === 'NONE' ? alertCopy[card.utilizationAlert] : <><AlertTriangle size={13} />{alertCopy[card.utilizationAlert]}</>}</span><span className="font-semibold text-white">{card.utilization.toFixed(1)}%</span></div><div className="mt-5 grid grid-cols-2 border-t border-white/10 pt-4 text-xs text-[#8ca59e]"><span className="flex items-center gap-1"><CalendarDays size={13} />Corte: día {card.statementCloseDay}</span><span className="text-right">Pago: día {card.paymentDueDay}</span></div><p className="mt-3 text-xs text-[#8ca59e]">Límite {money(card.creditLimit, card.currency)} · APR {card.apr.toFixed(2)}%</p></article>)}</section>
      <aside className="ui-card h-fit p-5"><div className="mb-5 flex items-center gap-2"><Plus size={17} className="text-[var(--accent)]" /><h2 className="font-medium text-white">Configurar tarjeta</h2></div>{unconfigured.length === 0 ? <div className="rounded-xl border border-white/10 p-4"><WalletCards size={18} className="text-[#8ca59e]" /><p className="mt-3 text-sm font-medium text-white">No hay cuentas de crédito pendientes</p><p className="mt-1 text-sm leading-5 text-[#8ca59e]">Crea una cuenta de tipo Crédito en Cuentas para configurarla aquí.</p></div> : <form onSubmit={submit} className="grid gap-3"><label className="grid gap-2 text-sm text-[#a9c0b8]">Cuenta de crédito<select required value={accountId} onChange={(event) => setAccountId(event.target.value)} className="ui-field">{unconfigured.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm text-[#a9c0b8]">Banco<input required value={bank} onChange={(event) => setBank(event.target.value)} className="ui-field" placeholder="Ej. BBVA" /></label><label className="grid gap-2 text-sm text-[#a9c0b8]">Producto<input required value={product} onChange={(event) => setProduct(event.target.value)} className="ui-field" placeholder="Ej. Oro" /></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm text-[#a9c0b8]">Límite<input required value={creditLimit} onChange={(event) => setCreditLimit(event.target.value)} type="number" min="0.01" step="0.01" className="ui-field" placeholder="0.00" /></label><label className="grid gap-2 text-sm text-[#a9c0b8]">APR anual (%)<input required value={apr} onChange={(event) => setApr(event.target.value)} type="number" min="0" step="0.01" className="ui-field" placeholder="0.00" /></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm text-[#a9c0b8]">Día de corte<input required value={statementCloseDay} onChange={(event) => setStatementCloseDay(event.target.value)} type="number" min="1" max="31" className="ui-field" placeholder="1–31" /></label><label className="grid gap-2 text-sm text-[#a9c0b8]">Día de pago<input required value={paymentDueDay} onChange={(event) => setPaymentDueDay(event.target.value)} type="number" min="1" max="31" className="ui-field" placeholder="1–31" /></label></div><button disabled={saving || !accountId} aria-busy={saving} className="ui-button-primary mt-1 w-full">{saving ? 'Guardando…' : 'Guardar tarjeta'}</button></form>}</aside>
    </div>
  </>
}
