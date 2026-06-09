import { notFound } from 'next/navigation'
import { getSuratPengantarById } from '@/app/actions/surat-pengantar'
import { decryptCetakToken } from '@/lib/cetak-token'
import { PrintView } from '@/components/portal/print-view'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

export default async function CetakPage({ params }: Props) {
  const { token } = await params

  // Decrypt the token to recover the original numeric ID.
  // Returns null if the token is missing, malformed, or tampered.
  const id = decryptCetakToken(token)
  if (id === null) notFound()

  const surat = await getSuratPengantarById(id)
  if (!surat) notFound()

  // Only allow printing when the surat has been marked selesai by the admin.
  if (surat.status !== 'selesai') notFound()

  return <PrintView surat={surat} />
}
