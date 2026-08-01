'use client'

import { useEffect, useState } from 'react'
import type { AccountDto, GoalWithProgressDto } from '@finance/shared'
import { Plus, Target } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { money } from '@/lib/format'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { ProgressBar } from '@/components/shared/progress-bar'

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalWithProgressDto[]>([])
  const [accounts, setAccounts] = useState<AccountDto[]>([])
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [expectedAnnualReturn, setExpectedAnnualReturn] = useState('0')
  const [monthlyContributionTarget, setMonthlyContributionTarget] = useState('')
  const [contributions, setContributions] = useState<Record<string, string>>({})
  const [projectionSettings, setProjectionSettings] = useState<Record<string, { expectedAnnualReturn: string; monthlyContributionTarget: string }>>({})
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [contributingId, setContributingId] = useState<string | null>(null)
  const [savingProjectionId, setSavingProjectionId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [goalData, accountData] = await Promise.all([
        apiFetch<GoalWithProgressDto[]>('/goals'),
        apiFetch<AccountDto[]>('/accounts'),
      ])
      setGoals(goalData)
      setProjectionSettings(Object.fromEntries(goalData.map((goal) => [goal.id, {
        expectedAnnualReturn: String(goal.expectedAnnualReturn),
        monthlyContributionTarget: goal.monthlyContributionTarget === null ? '' : String(goal.monthlyContributionTarget),
      }])))
      setAccounts(accountData)
      setAccountId((value) => value || accountData[0]?.id || '')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar tus metas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreating(true)
    setError('')
    try {
      await apiFetch('/goals', { method: 'POST', body: JSON.stringify({
        name,
        targetAmount: Number(targetAmount),
        deadline: deadline || undefined,
        expectedAnnualReturn: Number(expectedAnnualReturn),
        monthlyContributionTarget: monthlyContributionTarget === '' ? undefined : Number(monthlyContributionTarget),
      }) })
      setName('')
      setTargetAmount('')
      setDeadline('')
      setExpectedAnnualReturn('0')
      setMonthlyContributionTarget('')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la meta.')
    } finally {
      setCreating(false)
    }
  }

  async function saveProjection(goalId: string) {
    const settings = projectionSettings[goalId]
    if (!settings) return
    setSavingProjectionId(goalId)
    setError('')
    try {
      await apiFetch(`/goals/${goalId}`, { method: 'PATCH', body: JSON.stringify({
        expectedAnnualReturn: Number(settings.expectedAnnualReturn),
        monthlyContributionTarget: settings.monthlyContributionTarget === '' ? null : Number(settings.monthlyContributionTarget),
      }) })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la proyección.')
    } finally {
      setSavingProjectionId(null)
    }
  }

  async function contribute(goalId: string) {
    const amount = Number(contributions[goalId])
    if (!amount || !accountId) {
      setError('Elige una cuenta e ingresa un monto mayor que cero para aportar.')
      return
    }

    setContributingId(goalId)
    setError('')
    try {
      await apiFetch(`/goals/${goalId}/contribute`, { method: 'POST', body: JSON.stringify({ amount, accountId }) })
      setContributions((current) => ({ ...current, [goalId]: '' }))
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar el aporte.')
    } finally {
      setContributingId(null)
    }
  }

  return <>
    <PageHeader eyebrow="Futuro tangible" title="Metas de ahorro" description="Cada aporte reduce la distancia entre una intención y una reserva real." />
    {error && <div role="alert" className="mb-6 rounded-xl bg-[#ff8374]/10 p-4 text-sm text-[#ffab9f]"><p>{error}</p><button type="button" onClick={load} disabled={loading} className="mt-3 rounded-lg border border-[#ff8374]/40 px-3 py-2 font-semibold hover:bg-[#ff8374]/10 disabled:opacity-50">Reintentar</button></div>}
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
      <form onSubmit={create} className="ui-card h-fit p-5">
        <div className="mb-5 flex items-center gap-2"><Plus size={17} className="text-[var(--accent)]" /><h2 className="font-medium text-white">Nueva meta</h2></div>
        <div className="grid gap-3">
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required placeholder="Ej. Fondo de emergencia" className="ui-field text-sm" />
           <input value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} required type="number" min="1" step="0.01" placeholder="Monto objetivo" className="ui-field text-sm" />
           <label className="grid gap-2 text-sm text-[#a9c0b8]">Fecha objetivo (opcional)<input value={deadline} onChange={(event) => setDeadline(event.target.value)} type="date" className="ui-field" /></label>
           <label className="grid gap-2 text-sm text-[#a9c0b8]">Rendimiento anual esperado (%)<input value={expectedAnnualReturn} onChange={(event) => setExpectedAnnualReturn(event.target.value)} type="number" min="0" step="0.01" className="ui-field" /></label>
           <label className="grid gap-2 text-sm text-[#a9c0b8]">Aporte mensual planeado (opcional)<input value={monthlyContributionTarget} onChange={(event) => setMonthlyContributionTarget(event.target.value)} type="number" min="0" step="0.01" className="ui-field" /></label>
          <button disabled={creating} aria-busy={creating} className="ui-button-primary w-full">{creating ? 'Creando…' : 'Crear meta'}</button>
        </div>
      </form>
      <section aria-busy={loading} className="grid gap-4">
        {loading ? <p aria-live="polite" className="py-12 text-center text-sm text-[#8ca59e]">Cargando metas...</p> : goals.length === 0 ? <EmptyState icon={Target} title="Todavía no hay metas" detail="Crea una meta para convertir tu ahorro en avance visible." /> : goals.map((goal) => <article key={goal.id} className="ui-card p-5">
          <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-medium text-white">{goal.name}</p><p className="mt-1 text-sm text-[#8ca59e]">{money(goal.currentAmount)} de {money(goal.targetAmount)}</p></div><span className="text-lg font-semibold text-[var(--accent)]">{goal.percentage.toFixed(0)}%</span></div>
           <div className="mt-5"><ProgressBar label={`Avance de ${goal.name}`} value={goal.percentage} /></div>
           <section className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4" aria-label={`Proyección de ${goal.name}`}>
             <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-white">Proyección</p><span className="text-xs font-semibold text-[var(--accent)]">{goal.projectionStatus === 'ON_TRACK' ? 'En camino' : goal.projectionStatus === 'AT_RISK' ? 'En riesgo' : goal.projectionStatus === 'COMPLETED' ? 'Completada' : 'Sin financiamiento'}</span></div>
             <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><p className="text-[#8ca59e]">Meses: <span className="text-white">{goal.monthsToDeadline ?? 'Sin fecha'}</span></p><p className="text-[#8ca59e]">Proyectado: <span className="text-white">{goal.projectedAmount === null ? 'Sin fecha' : money(goal.projectedAmount)}</span></p><p className="text-[#8ca59e]">Aporte necesario: <span className="text-white">{goal.requiredMonthlyContribution === null ? 'No disponible' : `${money(goal.requiredMonthlyContribution)}/mes`}</span></p></div>
             <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input value={projectionSettings[goal.id]?.expectedAnnualReturn ?? ''} onChange={(event) => setProjectionSettings((current) => ({ ...current, [goal.id]: { ...(current[goal.id] ?? { expectedAnnualReturn: String(goal.expectedAnnualReturn), monthlyContributionTarget: goal.monthlyContributionTarget === null ? '' : String(goal.monthlyContributionTarget) }), expectedAnnualReturn: event.target.value } }))} type="number" min="0" step="0.01" aria-label={`Rendimiento anual esperado para ${goal.name}`} placeholder="Rendimiento anual %" className="ui-field text-sm" /><input value={projectionSettings[goal.id]?.monthlyContributionTarget ?? ''} onChange={(event) => setProjectionSettings((current) => ({ ...current, [goal.id]: { ...(current[goal.id] ?? { expectedAnnualReturn: String(goal.expectedAnnualReturn), monthlyContributionTarget: goal.monthlyContributionTarget === null ? '' : String(goal.monthlyContributionTarget) }), monthlyContributionTarget: event.target.value } }))} type="number" min="0" step="0.01" aria-label={`Aporte mensual planeado para ${goal.name}`} placeholder="Aporte mensual" className="ui-field text-sm" /><button type="button" onClick={() => saveProjection(goal.id)} disabled={savingProjectionId === goal.id} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{savingProjectionId === goal.id ? 'Guardando…' : 'Actualizar'}</button></div>
           </section>
           <div className="mt-4 flex flex-col gap-3 sm:flex-row"><select value={accountId} onChange={(event) => setAccountId(event.target.value)} aria-label={`Cuenta para aportar a ${goal.name}`} className="ui-field sm:w-auto">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><input value={contributions[goal.id] ?? ''} onChange={(event) => setContributions((current) => ({ ...current, [goal.id]: event.target.value }))} type="number" min="1" step="0.01" placeholder="Aportar monto" aria-label={`Monto para aportar a ${goal.name}`} className="ui-field min-w-0 flex-1" /><button type="button" onClick={() => contribute(goal.id)} disabled={!accounts.length || contributingId === goal.id} aria-busy={contributingId === goal.id} className="rounded-xl border border-[var(--accent)]/40 px-4 py-2 text-sm font-semibold text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50">{contributingId === goal.id ? 'Aportando…' : 'Aportar'}</button></div>
        </article>)}
      </section>
    </div>
  </>
}
