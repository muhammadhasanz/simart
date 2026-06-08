import { notFound } from 'next/navigation'
import { FamilyDetail } from '@/components/families/family-detail'
import { getFamilyById } from '@/app/actions/families'

interface KeluargaDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function KeluargaDetailPage({ params }: KeluargaDetailPageProps) {
  const { id } = await params
  const family = await getFamilyById(Number(id))

  if (!family) {
    notFound()
  }

  return <FamilyDetail family={family} />
}
