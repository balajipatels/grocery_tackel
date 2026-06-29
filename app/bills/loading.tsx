import { Skeleton } from "@/components/ui/skeleton"

export default function BillsLoading() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-gray-50">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
