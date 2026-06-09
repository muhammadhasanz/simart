import { KasIuranClient } from '@/components/kas-iuran/kas-iuran-client'
import { getKasIuranList } from '@/app/actions/kas-iuran'

export const metadata = {
  title: 'Kas & Iuran Digital | SiMart',
  description: 'Kelola kas dan iuran warga RT/RW secara digital.',
}

export default async function KasIuranPage() {
  const initialData = await getKasIuranList()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kas & Iuran Digital</h1>
        <p className="text-muted-foreground">
          Catat dan kelola pemasukan serta pengeluaran kas RT/RW
        </p>
      </div>
      <KasIuranClient initialData={initialData} />
    </div>
  )
}
