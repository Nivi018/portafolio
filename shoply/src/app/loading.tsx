import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-5 w-32 mt-2" />
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-8">
        <aside className="space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </aside>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
