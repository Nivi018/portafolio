'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, LockKeyhole, WalletCards } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('demo@financeapp.dev')
  const [password, setPassword] = useState('DemoPass123!')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const result = await authClient.signIn.email({ email, password })

      if (result.error) {
        setError(result.error.message ?? 'No fue posible iniciar sesión')
        return
      }

      const bootstrap = await fetch('/api/auth/bootstrap', { method: 'POST', credentials: 'include' })
      if (!bootstrap.ok) throw new Error('No pudimos preparar tu espacio financiero. Inténtalo de nuevo.')
      router.replace('/dashboard')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible iniciar sesión. Inténtalo de nuevo.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden border-r border-white/10 bg-[#101c1b] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 top-16 size-96 rounded-full bg-[#5ee8b2]/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[#5ee8b2] text-xl font-black text-[#0b1212]">N</span>
          <span><strong className="block tracking-[0.18em]">NEXA</strong><small className="text-[#8ca59e]">personal finance</small></span>
        </div>
        <div className="relative max-w-xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#5ee8b2]">Visibilidad, no fricción</p>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight text-white">Cada peso con un propósito claro.</h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-[#8ca59e]">Centraliza movimientos, metas y presupuestos en una consola diseñada para tomar mejores decisiones.</p>
        </div>
        <div className="relative flex items-center gap-3 text-sm text-[#a9c0b8]"><LockKeyhole size={17} className="text-[#5ee8b2]" /> Sesión segura administrada por Better Auth</div>
      </section>

      <section className="grid place-items-center p-6 sm:p-10">
        <div className="ui-card w-full max-w-md rounded-3xl p-7 sm:p-9">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><WalletCards className="text-[#5ee8b2]" /><strong>NEXA</strong></div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5ee8b2]">Bienvenido de vuelta</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Inicia sesión</h2>
          <p className="mt-2 text-sm text-[#8ca59e]">Usa la cuenta demo o ingresa con tus credenciales.</p>
          <form onSubmit={submit} className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm text-[#a9c0b8]">Correo electrónico
              <input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" type="email" required className="ui-field" />
            </label>
            <label className="grid gap-2 text-sm text-[#a9c0b8]">Contraseña
              <input value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" type="password" required className="ui-field" />
            </label>
            {error && <p role="alert" className="rounded-xl bg-[#ff8374]/10 px-3 py-2 text-sm text-[#ffab9f]">{error}</p>}
            <button disabled={pending} aria-busy={pending} className="ui-button-primary mt-2 w-full">
              {pending ? 'Entrando...' : 'Entrar a mi panel'} <ArrowRight size={17} />
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-[#8ca59e]">¿Aún no tienes cuenta? <Link href="/register" className="font-medium text-[#5ee8b2] hover:underline">Crear cuenta</Link></p>
        </div>
      </section>
    </main>
  )
}
