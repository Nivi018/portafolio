import type { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
      <div>
        <Icon size={26} className="mx-auto mb-3 text-[#5ee8b2]" />
        <p className="font-medium text-white">{title}</p>
        <p className="mt-1 text-sm text-[#8ca59e]">{detail}</p>
      </div>
    </div>
  )
}
