'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && !session) router.replace('/login')
  }, [isPending, router, session])

  if (isPending || !session) {
    return (
      <div aria-live="polite" aria-busy="true" className="grid min-h-screen place-items-center bg-[#0b1212] text-sm text-[#8ca59e]">
        Cargando tu espacio financiero...
      </div>
    )
  }

  return <>{children}</>
}
