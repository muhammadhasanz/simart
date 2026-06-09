import { InformasiClient } from '@/components/informasi/informasi-client'
import { getPengumumanList, getPollsWithOptions } from '@/app/actions/informasi'

export const metadata = {
  title: 'Pusat Informasi & Polling | SiMart',
  description: 'Pengumuman warga dan polling aspirasi RT/RW.',
}

export default async function InformasiPage() {
  const [initialPengumuman, initialPolls] = await Promise.all([
    getPengumumanList(),
    getPollsWithOptions(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Pusat Informasi & Polling
        </h1>
        <p className="text-muted-foreground">
          Pengumuman warga dan sarana aspirasi melalui polling digital
        </p>
      </div>
      <InformasiClient
        initialPengumuman={initialPengumuman}
        initialPolls={initialPolls}
      />
    </div>
  )
}
