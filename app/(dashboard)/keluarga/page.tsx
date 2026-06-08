import { FamilyTable } from '@/components/families/family-table'
import { getFamilies } from '@/app/actions/families'

interface KeluargaPageProps {
  searchParams: Promise<{
    search?: string
  }>
}

export default async function KeluargaPage({ searchParams }: KeluargaPageProps) {
  const params = await searchParams
  const { data, total } = await getFamilies({
    search: params.search,
    limit: 20,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Keluarga</h1>
        <p className="text-muted-foreground">
          Kelola data Kartu Keluarga RT/RW
        </p>
      </div>

      <FamilyTable initialData={data} total={total} />
    </div>
  )
}
