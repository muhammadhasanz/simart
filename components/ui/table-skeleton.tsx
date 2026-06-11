import { Skeleton } from "@/components/ui/skeleton"

export function TableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[140px] hidden sm:block" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-md border bg-card">
        <div className="border-b px-4 py-4 flex gap-4">
          <Skeleton className="h-5 w-[150px] flex-1" />
          <Skeleton className="h-5 w-[100px] flex-1" />
          <Skeleton className="h-5 w-[80px] flex-1 hidden md:block" />
          <Skeleton className="h-5 w-[100px] flex-1 hidden lg:block" />
          <Skeleton className="h-5 w-[60px]" />
        </div>
        <div className="flex flex-col">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b px-4 py-4 last:border-0">
              <Skeleton className="h-4 w-full flex-1" />
              <Skeleton className="h-4 w-[100px] flex-1" />
              <Skeleton className="h-4 w-[80px] flex-1 hidden md:block" />
              <Skeleton className="h-4 w-[100px] flex-1 hidden lg:block" />
              <Skeleton className="h-8 w-[60px]" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Pagination text skeleton */}
      <Skeleton className="h-4 w-[250px] mt-2" />
    </div>
  )
}
