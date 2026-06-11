import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function WargaLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Warga</h1>
        <p className="text-muted-foreground">
          Kelola data warga RT/RW
        </p>
      </div>
      <TableSkeleton />
    </div>
  )
}
