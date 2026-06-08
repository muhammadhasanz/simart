import { ResidentForm } from '@/components/residents/resident-form'
import { getAllFamilies } from '@/app/actions/families'

export default async function TambahWargaPage() {
  const families = await getAllFamilies()

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tambah Warga Baru</h1>
        <p className="text-muted-foreground">
          Masukkan data warga baru ke dalam sistem
        </p>
      </div>

      <ResidentForm families={families} mode="create" />
    </div>
  )
}
