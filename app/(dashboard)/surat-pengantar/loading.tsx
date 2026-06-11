import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function SuratPengantarLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Surat Pengantar</h1>
        <p className="text-muted-foreground">
          Kelola permintaan surat pengantar RT/RW
        </p>
      </div>
      <TableSkeleton />
    </div>
  )
}
