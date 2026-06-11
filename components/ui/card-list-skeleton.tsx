import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

export function CardListSkeleton({ count = 3, tall = false }: { count?: number; tall?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-5 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className={tall ? 'h-24 w-full' : 'h-14 w-full'} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
