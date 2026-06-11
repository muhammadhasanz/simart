import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function KasIuranLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Kas & Iuran</h1>
        <p className="text-muted-foreground">
          Kelola data keuangan dan iuran warga RT/RW
        </p>
      </div>
      <TableSkeleton />
    </div>
  )
}
