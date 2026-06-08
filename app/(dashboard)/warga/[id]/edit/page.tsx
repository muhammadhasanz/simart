import { notFound } from 'next/navigation'
import { ResidentForm } from '@/components/residents/resident-form'
import { getResidentById } from '@/app/actions/residents'
import { getAllFamilies } from '@/app/actions/families'

interface EditWargaPageProps {
  params: Promise<{ id: string }>
}

export default async function EditWargaPage({ params }: EditWargaPageProps) {
  const { id } = await params
  const [resident, families] = await Promise.all([
    getResidentById(Number(id)),
    getAllFamilies(),
  ])

  if (!resident) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Data Warga</h1>
        <p className="text-muted-foreground">
          Perbarui data warga {resident.fullName}
        </p>
      </div>

      <ResidentForm resident={resident} families={families} mode="edit" />
    </div>
  )
}
