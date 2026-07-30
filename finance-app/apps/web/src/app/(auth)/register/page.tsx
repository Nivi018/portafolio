'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const result = await authClient.signUp.email({ name, email, password })
      if (result.error) {
        setError(result.error.message ?? 'No fue posible crear tu cuenta')
        return
      }

      const bootstrap = await fetch('/api/auth/bootstrap', { method: 'POST', credentials: 'include' })
      if (!bootstrap.ok) throw new Error('No pudimos preparar tu espacio financiero. Inténtalo de nuevo.')
      router.replace('/dashboard')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible crear tu cuenta. Inténtalo de nuevo.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="ui-card grid w-full max-w-5xl overflow-hidden rounded-3xl lg:grid-cols-[0.85fr_1.15fr]">
        <section className="hidden bg-[#5ee8b2] p-10 text-[#0b1212] lg:block">
          <p className="text-sm font-black tracking-[0.2em]">NEXA</p>
          <h1 className="mt-16 text-4xl font-semibold leading-tight">Construye un sistema que trabaje a tu favor.</h1>
          <ul className="mt-10 grid gap-5 text-sm font-medium">
            {['Categorías iniciales listas para usar', 'Tus datos aislados por cuenta', 'Resumen visual desde el primer día'].map((item) => <li key={item} className="flex gap-3"><CheckCircle2 size={19} />{item}</li>)}
          </ul>
        </section>
        <section className="p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5ee8b2]">Tu espacio personal</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Crea tu cuenta</h2>
          <p className="mt-2 text-sm text-[#8ca59e]">Toma menos de un minuto empezar a ver tus finanzas con claridad.</p>
          <form onSubmit={submit} className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm text-[#a9c0b8]">Nombre
               <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" minLength={2} maxLength={100} required className="ui-field" />
            </label>
            <label className="grid gap-2 text-sm text-[#a9c0b8]">Correo electrónico
               <input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" type="email" required className="ui-field" />
            </label>
            <label className="grid gap-2 text-sm text-[#a9c0b8]">Contraseña
               <input value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" type="password" minLength={8} required className="ui-field" />
            </label>
             {error && <p role="alert" className="rounded-xl bg-[#ff8374]/10 px-3 py-2 text-sm text-[#ffab9f]">{error}</p>}
             <button disabled={pending} aria-busy={pending} className="ui-button-primary mt-2 w-full">{pending ? 'Creando...' : 'Crear mi espacio'} <ArrowRight size={17} /></button>
          </form>
          <p className="mt-6 text-center text-sm text-[#8ca59e]">¿Ya tienes cuenta? <Link href="/login" className="font-medium text-[#5ee8b2] hover:underline">Iniciar sesión</Link></p>
        </section>
      </div>
    </main>
  )
}
