import { CardListSkeleton } from "@/components/ui/card-list-skeleton"

export default function InformasiLoading() {
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <CardListSkeleton count={2} />
        </div>
        <div className="flex flex-col gap-4">
          <CardListSkeleton count={2} />
        </div>
      </div>
    </div>
  )
}
