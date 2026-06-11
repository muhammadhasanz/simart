import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function KeluargaLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Keluarga</h1>
        <p className="text-muted-foreground">
          Kelola data Kartu Keluarga RT/RW
        </p>
      </div>
      <TableSkeleton />
    </div>
  )
}
