import { FamilyForm } from '@/components/families/family-form'

export default function TambahKeluargaPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tambah Keluarga Baru</h1>
        <p className="text-muted-foreground">
          Masukkan data Kartu Keluarga baru ke dalam sistem
        </p>
      </div>

      <FamilyForm mode="create" />
    </div>
  )
}
