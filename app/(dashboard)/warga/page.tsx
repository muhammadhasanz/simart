import { ResidentTable } from '@/components/residents/resident-table'
import { getResidents } from '@/app/actions/residents'

interface WargaPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    gender?: string
  }>
}

export default async function WargaPage({ searchParams }: WargaPageProps) {
  const params = await searchParams
  const { data, total } = await getResidents({
    search: params.search,
    status: params.status,
    gender: params.gender,
    limit: 20,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Warga</h1>
        <p className="text-muted-foreground">
          Kelola data warga RT/RW
        </p>
      </div>

      <ResidentTable initialData={data} total={total} />
    </div>
  )
}
