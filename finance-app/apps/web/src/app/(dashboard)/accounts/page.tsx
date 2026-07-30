'use client'

import { useEffect, useState } from 'react'
import type { AccountDto } from '@finance/shared'
import { ArrowRightLeft, Landmark, Plus, WalletCards } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { money } from '@/lib/format'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountDto[]>([])
  const [name, setName] = useState('')
  const [type, setType] = useState('CHECKING')
  const [balance, setBalance] = useState('0')
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [error, setError] = useState('')

  async function load() { const data = await apiFetch<AccountDto[]>('/accounts'); setAccounts(data); setFromAccountId((value) => value || data[0]?.id || ''); setToAccountId((value) => value || data[1]?.id || data[0]?.id || '') }
  useEffect(() => { load().catch((cause: Error) => setError(cause.message)) }, [])

  async function create(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); try { await apiFetch('/accounts', { method: 'POST', body: JSON.stringify({ name, type, balance: Number(balance), currency: 'MXN' }) }); setName(''); setBalance('0'); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo crear la cuenta') } }
  async function transfer(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); try { await apiFetch('/accounts/transfer', { method: 'POST', body: JSON.stringify({ fromAccountId, toAccountId, amount: Number(transferAmount) }) }); setTransferAmount(''); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo transferir') } }

  return <>
    <PageHeader eyebrow="Estructura" title="Cuentas y saldos" description="Separa tu efectivo, ahorro y crédito para leer el saldo con precisión." />
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><section>{accounts.length === 0 ? <EmptyState icon={WalletCards} title="No hay cuentas" detail="Crea una cuenta para comenzar a registrar dinero." /> : <div className="grid gap-4 sm:grid-cols-2">{accounts.map((account) => <article key={account.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5"><div className="absolute right-0 top-0 size-24 rounded-full bg-[#5ee8b2]/8 blur-2xl" /><div className="relative flex items-start justify-between"><div><p className="text-sm text-[#8ca59e]">{account.type}</p><h2 className="mt-1 font-medium text-white">{account.name}</h2></div><Landmark size={19} className="text-[#5ee8b2]" /></div><p className={`relative mt-10 text-3xl font-semibold ${account.balance < 0 ? 'text-[#ff8374]' : 'text-white'}`}>{money(account.balance, account.currency)}</p><p className="relative mt-2 text-xs text-[#8ca59e]">Saldo disponible</p></article>)}</div>}</section>
      <div className="grid h-fit gap-6"><form onSubmit={create} className="rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5"><div className="mb-4 flex items-center gap-2"><Plus size={17} className="text-[#5ee8b2]" /><h2 className="font-medium text-white">Nueva cuenta</h2></div><div className="grid gap-3"><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre de cuenta" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5ee8b2]" /><select value={type} onChange={(event) => setType(event.target.value)} className="rounded-xl border border-white/10 bg-[#162725] px-3 py-2.5 text-sm text-white"><option value="CHECKING">Débito / corriente</option><option value="SAVINGS">Ahorro</option><option value="CASH">Efectivo</option><option value="CREDIT">Crédito</option></select><input value={balance} onChange={(event) => setBalance(event.target.value)} type="number" step="0.01" placeholder="Saldo inicial" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5ee8b2]" /><button className="rounded-xl bg-[#5ee8b2] py-2.5 text-sm font-semibold text-[#0b1212]">Crear cuenta</button></div></form>
        <form onSubmit={transfer} className="rounded-2xl border border-white/10 bg-[#101c1b]/80 p-5"><div className="mb-4 flex items-center gap-2"><ArrowRightLeft size={17} className="text-[#5ee8b2]" /><h2 className="font-medium text-white">Mover dinero</h2></div><div className="grid gap-3"><select value={fromAccountId} onChange={(event) => setFromAccountId(event.target.value)} className="rounded-xl border border-white/10 bg-[#162725] px-3 py-2.5 text-sm text-white">{accounts.map((account) => <option key={account.id} value={account.id}>Desde: {account.name}</option>)}</select><select value={toAccountId} onChange={(event) => setToAccountId(event.target.value)} className="rounded-xl border border-white/10 bg-[#162725] px-3 py-2.5 text-sm text-white">{accounts.map((account) => <option key={account.id} value={account.id}>Hacia: {account.name}</option>)}</select><input value={transferAmount} onChange={(event) => setTransferAmount(event.target.value)} required min="0.01" type="number" step="0.01" placeholder="Monto" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#5ee8b2]" /><button disabled={accounts.length < 2} className="rounded-xl border border-[#5ee8b2]/40 py-2.5 text-sm font-semibold text-[#5ee8b2] disabled:opacity-50">Transferir</button></div></form>
        {error && <p className="rounded-xl bg-[#ff8374]/10 p-3 text-sm text-[#ffab9f]">{error}</p>}</div></div>
  </>
}
