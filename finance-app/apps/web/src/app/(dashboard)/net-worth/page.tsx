'use client'

import { useEffect, useState } from 'react'
import type { AssetDto, NetWorthDto } from '@finance/shared'
import { Landmark, Plus, RefreshCw, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { apiFetch } from '@/lib/api-client'
import { dateInputValue, money } from '@/lib/format'

const assetTypes = [
  ['CASH', 'Efectivo e inversiones'], ['INVESTMENT', 'Inversión'], ['PROPERTY', 'Propiedad'], ['VEHICLE', 'Vehículo'], ['OTHER', 'Otro'],
] as const

export default function NetWorthPage() {
  const [netWorth, setNetWorth] = useState<NetWorthDto | null>(null)
  const [assets, setAssets] = useState<AssetDto[]>([])
  const [form, setForm] = useState({ name: '', type: 'INVESTMENT', currentValue: '', notes: '' })
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingAssetId, setUpdatingAssetId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [summary, assetData] = await Promise.all([apiFetch<NetWorthDto>('/net-worth'), apiFetch<AssetDto[]>('/assets')])
      setNetWorth(summary); setAssets(assetData)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo cargar tu patrimonio.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (saving) return; setSaving(true); setError('')
    try { await apiFetch('/assets', { method: 'POST', body: JSON.stringify({ ...form, currentValue: Number(form.currentValue) }) }); setForm({ name: '', type: 'INVESTMENT', currentValue: '', notes: '' }); await load() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo agregar el activo.') }
    finally { setSaving(false) }
  }
  async function valueAsset(asset: AssetDto) {
    const value = Number(values[asset.id]); if (!Number.isFinite(value) || value < 0) return setError('Ingresa un valor de valuación válido.')
    if (updatingAssetId) return
    setUpdatingAssetId(asset.id); setError('')
    try { await apiFetch(`/assets/${asset.id}/valuations`, { method: 'POST', body: JSON.stringify({ value, date: dateInputValue() }) }); setValues((current) => ({ ...current, [asset.id]: '' })); await load() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo registrar la valuación.') }
    finally { setUpdatingAssetId(null) }
  }

  return <>
    <PageHeader eyebrow="Visión completa" title="Patrimonio neto" description="Conecta lo que tienes con lo que debes para tomar decisiones con una cifra real." />
    {error ? <div role="alert" className="mb-6 rounded-xl border border-finance-danger/30 bg-finance-danger/10 p-4 text-sm text-[#ffab9f]"><p>{error}</p><button type="button" onClick={() => void load()} disabled={loading} className="mt-3 rounded-lg border border-finance-danger/40 px-3 py-2 font-semibold disabled:opacity-50">Reintentar</button></div> : null}
    <section aria-busy={loading} className="mb-6 grid gap-4 md:grid-cols-3">
      <Metric label="Patrimonio neto" value={netWorth?.netWorth} icon={TrendingUp} emphasis />
      <Metric label="Activos" value={netWorth?.assets} icon={Landmark} />
      <Metric label="Pasivos" value={netWorth?.liabilities} icon={RefreshCw} danger />
    </section>
    <div className="grid gap-6 xl:grid-cols-[minmax(18rem,.7fr)_minmax(0,1.3fr)]">
      <form onSubmit={create} aria-busy={saving} className="ui-card h-fit p-5">
        <div className="mb-5"><p className="text-sm font-semibold text-finance-text">Agregar activo</p><p className="mt-1 text-sm text-finance-muted">Registra bienes e inversiones fuera de tus cuentas.</p></div>
        <div className="grid gap-3"><label className="grid gap-1 text-sm text-finance-muted">Nombre del activo<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="ui-field" /></label><label className="grid gap-1 text-sm text-finance-muted">Tipo<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="ui-field">{assetTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="grid gap-1 text-sm text-finance-muted">Valor actual<input required min="0" step="0.01" type="number" value={form.currentValue} onChange={(event) => setForm({ ...form, currentValue: event.target.value })} className="ui-field" /></label><label className="grid gap-1 text-sm text-finance-muted">Notas opcionales<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="ui-field min-h-24 resize-y" /></label><button disabled={saving} aria-busy={saving} className="ui-button-primary">{saving ? 'Guardando...' : <><Plus size={17} />Agregar activo</>}</button></div>
      </form>
      <section aria-busy={loading}>{loading ? <p aria-live="polite" className="py-12 text-center text-sm text-finance-muted">Calculando patrimonio...</p> : assets.length === 0 ? <EmptyState icon={Landmark} title="Aún no tienes activos registrados" detail="Agrega inversiones, propiedades o bienes para ver un patrimonio más completo." /> : <div className="grid gap-3">{assets.map((asset) => <article key={asset.id} className="ui-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-finance-text">{asset.name}</p><p className="mt-1 break-words text-xs text-finance-muted">{assetTypes.find(([type]) => type === asset.type)?.[1]}{asset.notes ? ` · ${asset.notes}` : ''}</p></div><strong className="text-lg text-finance-text">{money(asset.currentValue)}</strong></div><div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4"><input aria-label={`Nueva valuación para ${asset.name}`} min="0" step="0.01" type="number" value={values[asset.id] ?? ''} onChange={(event) => setValues({ ...values, [asset.id]: event.target.value })} placeholder="Nueva valuación" className="ui-field min-w-44 flex-1" /><button type="button" onClick={() => void valueAsset(asset)} disabled={updatingAssetId !== null} aria-busy={updatingAssetId === asset.id} className="ui-button-primary">{updatingAssetId === asset.id ? 'Actualizando...' : <><RefreshCw size={16} />Actualizar valor</>}</button></div></article>)}</div>}</section>
    </div>
  </>
}

function Metric({ label, value, icon: Icon, emphasis = false, danger = false }: { label: string; value: number | undefined; icon: typeof TrendingUp; emphasis?: boolean; danger?: boolean }) {
  return <article className={`ui-card p-5 ${emphasis ? 'bg-finance-accent/10' : ''}`}><div className="flex items-center justify-between gap-3"><span className="text-sm text-finance-muted">{label}</span><Icon size={18} className={danger ? 'text-finance-danger' : 'text-finance-accent'} /></div><p className={`mt-4 text-3xl font-semibold tracking-tight ${danger ? 'text-finance-danger' : 'text-finance-text'}`}>{value === undefined ? '...' : money(value)}</p></article>
}
