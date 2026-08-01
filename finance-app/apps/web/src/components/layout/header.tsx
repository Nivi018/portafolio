'use client'

import { LogOut, Plus, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { apiFetch } from '@/lib/api-client'

type FinancialSpace = {
  id: string
  name: string
  type: 'PERSONAL' | 'HOUSEHOLD'
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
}

export function Header() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [spaces, setSpaces] = useState<FinancialSpace[]>([])
  const [selectedSpaceId, setSelectedSpaceId] = useState('')

  useEffect(() => {
    void apiFetch<FinancialSpace[]>('/financial-spaces')
      .then((data) => {
        setSpaces(data)
        const stored = localStorage.getItem('financial-space-id')
        setSelectedSpaceId(data.some((space) => space.id === stored) ? stored! : data[0]?.id ?? '')
      })
      .catch(() => undefined)
  }, [])

  function selectFinancialSpace(financialSpaceId: string) {
    localStorage.setItem('financial-space-id', financialSpaceId)
    setSelectedSpaceId(financialSpaceId)
    window.location.reload()
  }

  async function signOut() {
    await authClient.signOut()
    router.replace('/login')
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 lg:px-9">
      <div className="flex items-center gap-3 lg:hidden">
        <span className="grid size-8 place-items-center rounded-lg bg-[#5ee8b2] text-sm font-black text-[#0b1212]">N</span>
        <strong className="text-sm tracking-[0.14em]">NEXA</strong>
      </div>
      <div className="hidden items-center gap-2 text-sm text-[#8ca59e] lg:flex">
        <Sparkles size={16} className="text-[#5ee8b2]" />
        <span>Tu panorama financiero está al día</span>
      </div>
       <div className="ml-auto flex items-center gap-2">
         {spaces.length > 1 ? (
           <label className="sr-only" htmlFor="financial-space">Espacio financiero</label>
         ) : null}
         {spaces.length > 1 ? (
           <select
             id="financial-space"
             value={selectedSpaceId}
             onChange={(event) => selectFinancialSpace(event.target.value)}
             className="hidden min-h-11 max-w-44 rounded-xl border border-white/10 bg-transparent px-3 text-sm text-white sm:block"
           >
             {spaces.map((space) => (
               <option key={space.id} value={space.id} className="bg-[#0b1212]">
                 {space.name}
               </option>
             ))}
           </select>
         ) : null}
        <button onClick={() => router.push('/transactions')} className="hidden min-h-11 items-center gap-2 rounded-xl bg-[#5ee8b2] px-3.5 py-2 text-sm font-semibold text-[#0b1212] sm:flex">
          <Plus size={16} /> Movimiento
        </button>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-white">{session?.user.name ?? 'Usuario'}</p>
          <p className="text-xs text-[#8ca59e]">{session?.user.email}</p>
        </div>
        <button onClick={signOut} aria-label="Cerrar sesión" className="grid size-11 place-items-center rounded-xl border border-white/10 text-[#8ca59e] hover:border-[#ff8374]/50 hover:text-[#ff8374]">
          <LogOut size={17} />
        </button>
      </div>
    </header>
  )
}
