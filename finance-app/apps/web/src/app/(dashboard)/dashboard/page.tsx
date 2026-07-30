import { DashboardView } from '@/components/dashboard/dashboard-view'
import { PageHeader } from '@/components/shared/page-header'

export default function DashboardPage() {
  return <><PageHeader eyebrow="Vista general" title="Tu dinero, con perspectiva." description="Lee el ritmo de tus finanzas antes de decidir qué hacer después." /><DashboardView /></>
}
