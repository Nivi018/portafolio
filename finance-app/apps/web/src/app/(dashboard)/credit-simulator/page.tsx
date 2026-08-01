'use client'

import { useState } from 'react'
import type { CreditSimulatorDto } from '@finance/shared'
import { Calculator, ChevronDown } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { money } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'

const initialForm = { principal: '100000', annualRate: '12', termMonths: '36', monthlyExtraPayment: '0' }

export default function CreditSimulatorPage() {
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState<CreditSimulatorDto | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))

  async function simulate(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      setResult(await apiFetch<CreditSimulatorDto>('/credit-simulator', {
        method: 'POST',
        body: JSON.stringify({
          principal: Number(form.principal),
          annualRate: Number(form.annualRate),
          termMonths: Number(form.termMonths),
          monthlyExtraPayment: Number(form.monthlyExtraPayment || 0),
        }),
      }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo calcular el crédito.')
    } finally {
      setLoading(false)
    }
  }

  return <>
    <PageHeader eyebrow="Planea antes de comprometerte" title="Simulador de crédito" description="Proyecta mensualidades, costo financiero y el impacto de adelantar capital sin guardar ningún préstamo." />
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <form onSubmit={simulate} className="ui-card h-fit p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]"><Calculator size={20} /></span><div><h2 className="font-semibold text-white">Datos del crédito</h2><p className="text-xs text-[#8ca59e]">La simulación no se guarda.</p></div></div>
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-sm text-[#a9c0b8]">Monto solicitado<input required min="0.01" step="0.01" type="number" value={form.principal} onChange={(event) => update('principal', event.target.value)} className="ui-field" /></label>
          <label className="grid gap-1.5 text-sm text-[#a9c0b8]">Tasa anual (%)<input required min="0" step="0.01" type="number" value={form.annualRate} onChange={(event) => update('annualRate', event.target.value)} className="ui-field" /></label>
          <label className="grid gap-1.5 text-sm text-[#a9c0b8]">Plazo (meses)<input required min="1" step="1" type="number" value={form.termMonths} onChange={(event) => update('termMonths', event.target.value)} className="ui-field" /></label>
          <label className="grid gap-1.5 text-sm text-[#a9c0b8]">Pago adicional mensual <span className="text-xs text-[#718981]">Opcional</span><input min="0" step="0.01" type="number" value={form.monthlyExtraPayment} onChange={(event) => update('monthlyExtraPayment', event.target.value)} className="ui-field" /></label>
          <button disabled={loading} className="ui-button-primary mt-2 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Calculando...' : 'Calcular simulación'}</button>
        </div>
      </form>
      <section aria-busy={loading} className="min-w-0">{error ? <div role="alert" className="mb-5 rounded-xl bg-finance-danger/10 p-4 text-sm text-[#ffab9f]"><p>{error}</p><button type="button" onClick={() => void simulate()} disabled={loading} className="mt-3 rounded-lg border border-finance-danger/40 px-3 py-2 font-semibold disabled:opacity-50">Reintentar</button></div> : null}{result ? <div className="grid gap-6">
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          <Metric label="Pago mensual" value={money(result.monthlyPayment)} detail="Sin pago adicional" />
          <Metric label="Intereses totales" value={money(result.totalInterest)} detail="Durante toda la vida" />
          <Metric label="Costo total" value={money(result.totalCost)} detail="Capital más intereses" />
          <Metric label="Liquidación" value={`${result.payoffMonths} meses`} detail={`De ${form.termMonths} meses previstos`} />
        </div>
        <div className="ui-card overflow-hidden">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5"><div><h2 className="font-semibold text-white">Tabla de amortización</h2><p className="mt-1 text-sm text-[#8ca59e]">Cada pago separa intereses, capital y abonos adicionales.</p></div><span className="rounded-lg bg-white/5 px-3 py-1 text-xs text-[#a9c0b8]">{result.schedule.length} pagos</span></div>
          <div className="overflow-x-auto"><table className="min-w-[720px] w-full text-left text-sm"><thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-[#8ca59e]"><tr><th className="px-5 py-3">Mes</th><th className="px-5 py-3">Pago</th><th className="px-5 py-3">Interés</th><th className="px-5 py-3">Capital</th><th className="px-5 py-3">Adicional</th><th className="px-5 py-3 text-right">Saldo</th></tr></thead><tbody>{result.schedule.map((row) => <tr key={row.month} className="border-t border-white/5 text-[#d5e2dd]"><td className="px-5 py-3 font-medium text-white">{row.month}</td><td className="px-5 py-3">{money(row.payment)}</td><td className="px-5 py-3 text-[#ffb36b]">{money(row.interest)}</td><td className="px-5 py-3 text-[#5ee8b2]">{money(row.principal)}</td><td className="px-5 py-3">{row.extraPayment ? money(row.extraPayment) : '—'}</td><td className="px-5 py-3 text-right font-medium">{money(row.balance)}</td></tr>)}</tbody></table></div>
        </div>
      </div> : <div className="ui-card grid min-h-80 place-items-center p-8 text-center"><div><Calculator size={30} className="mx-auto mb-4 text-[var(--accent)]" /><h2 className="font-semibold text-white">Configura tu escenario</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#8ca59e]">Ingresa los datos del crédito para ver su costo y calendario de pagos.</p><ChevronDown size={18} className="mx-auto mt-5 text-[#8ca59e]" /></div></div>}</section>
    </div>
  </>
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="ui-card p-5"><p className="text-xs uppercase tracking-wider text-[#8ca59e]">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p><p className="mt-2 text-xs text-[#718981]">{detail}</p></article>
}
