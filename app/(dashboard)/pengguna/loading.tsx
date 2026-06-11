import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function PenggunaLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Pengguna</h1>
        <p className="text-muted-foreground">
          Kelola akses pengguna (Admin/Warga)
        </p>
      </div>
      <TableSkeleton />
    </div>
  )
}
