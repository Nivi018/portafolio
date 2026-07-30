import { AuthGuard } from '@/components/auth-guard'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Sidebar />
      <div className="min-h-screen pb-20 lg:ml-64 lg:pb-0">
        <Header />
        <main className="mx-auto w-full max-w-[1560px] px-5 py-8 lg:px-9 lg:py-10">{children}</main>
      </div>
    </AuthGuard>
  )
}
