import { notFound } from 'next/navigation'
import { FamilyForm } from '@/components/families/family-form'
import { getFamilyById } from '@/app/actions/families'

interface EditKeluargaPageProps {
  params: Promise<{ id: string }>
}

export default async function EditKeluargaPage({ params }: EditKeluargaPageProps) {
  const { id } = await params
  const family = await getFamilyById(Number(id))

  if (!family) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Data Keluarga</h1>
        <p className="text-muted-foreground">
          Perbarui data Kartu Keluarga {family.familyCardNumber}
        </p>
      </div>

      <FamilyForm family={family} mode="edit" />
    </div>
  )
}
