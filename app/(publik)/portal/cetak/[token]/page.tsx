import { PrintView } from '@/components/portal/print-view'

interface Props {
  params: Promise<{ token: string }>
}

export default async function CetakPage({ params }: Props) {
  const { token } = await params
  return <PrintView token={token} />
}
