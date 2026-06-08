import { notFound } from 'next/navigation'
import { ResidentDetail } from '@/components/residents/resident-detail'
import { getResidentById } from '@/app/actions/residents'

interface WargaDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function WargaDetailPage({ params }: WargaDetailPageProps) {
  const { id } = await params
  const resident = await getResidentById(Number(id))

  if (!resident) {
    notFound()
  }

  return <ResidentDetail resident={resident} />
}
