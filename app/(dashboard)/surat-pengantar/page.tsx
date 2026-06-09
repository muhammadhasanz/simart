import { SuratPengantarClient } from '@/components/surat-pengantar/surat-pengantar-client'
import { getSuratPengantarList } from '@/app/actions/surat-pengantar'

export const metadata = {
  title: 'E-Surat Pengantar | SiMart',
  description: 'Buat dan kelola surat pengantar warga RT/RW secara digital.',
}

export default async function SuratPengantarPage() {
  const initialData = await getSuratPengantarList()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">E-Surat Pengantar</h1>
        <p className="text-muted-foreground">
          Buat, kelola, dan cetak surat pengantar warga secara digital
        </p>
      </div>
      <SuratPengantarClient initialData={initialData} />
    </div>
  )
}
