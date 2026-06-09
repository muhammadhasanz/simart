import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Pencil, Home } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { Resident, Family } from '@/lib/db/schema'

interface ResidentDetailProps {
  resident: Resident & { family: Family | null }
}

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  moved: 'Pindah',
  deceased: 'Meninggal',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  moved: 'secondary',
  deceased: 'destructive',
}

const genderLabels: Record<string, string> = {
  male: 'Laki-laki',
  female: 'Perempuan',
}

const religionLabels: Record<string, string> = {
  islam: 'Islam',
  kristen: 'Kristen',
  katolik: 'Katolik',
  hindu: 'Hindu',
  buddha: 'Buddha',
  konghucu: 'Konghucu',
}

const maritalStatusLabels: Record<string, string> = {
  belum_kawin: 'Belum Kawin',
  kawin: 'Kawin',
  cerai_hidup: 'Cerai Hidup',
  cerai_mati: 'Cerai Mati',
}

const educationLabels: Record<string, string> = {
  tidak_sekolah: 'Tidak/Belum Sekolah',
  sd: 'SD/Sederajat',
  smp: 'SMP/Sederajat',
  sma: 'SMA/Sederajat',
  d1_d2: 'Diploma I/II',
  d3: 'Diploma III',
  s1_d4: 'S1/Diploma IV',
  s2: 'S2',
  s3: 'S3',
}

const familyStatusLabels: Record<string, string> = {
  kepala_keluarga: 'Kepala Keluarga',
  istri: 'Istri',
  anak: 'Anak',
  menantu: 'Menantu',
  cucu: 'Cucu',
  orang_tua: 'Orang Tua',
  mertua: 'Mertua',
  famili_lain: 'Famili Lain',
  pembantu: 'Pembantu',
  lainnya: 'Lainnya',
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value || '-'}</span>
    </div>
  )
}

export function ResidentDetail({ resident }: ResidentDetailProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/warga" className={buttonVariants({ variant: 'outline', size: 'icon' })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{resident.fullName}</h1>
            <p className="text-muted-foreground font-mono">{resident.nik}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariants[resident.residentStatus || 'active']}>
            {statusLabels[resident.residentStatus || 'active']}
          </Badge>
          <Link href={`/warga/${resident.id}/edit`} className={buttonVariants()}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InfoItem
              label="Tempat, Tanggal Lahir"
              value={
                resident.birthPlace && resident.birthDate
                  ? `${resident.birthPlace}, ${format(new Date(resident.birthDate), 'd MMMM yyyy', { locale: id })}`
                  : resident.birthPlace || (resident.birthDate ? format(new Date(resident.birthDate), 'd MMMM yyyy', { locale: id }) : null)
              }
            />
            <InfoItem
              label="Jenis Kelamin"
              value={genderLabels[resident.gender || '']}
            />
            <InfoItem label="Golongan Darah" value={resident.bloodType} />
            <InfoItem
              label="Agama"
              value={religionLabels[resident.religion || '']}
            />
            <InfoItem
              label="Status Perkawinan"
              value={maritalStatusLabels[resident.maritalStatus || '']}
            />
            <InfoItem label="Kewarganegaraan" value={resident.nationality} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pendidikan & Pekerjaan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InfoItem
              label="Pendidikan Terakhir"
              value={educationLabels[resident.education || '']}
            />
            <InfoItem label="Pekerjaan" value={resident.occupation} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Keluarga</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {resident.family ? (
              <>
                <InfoItem
                  label="No. Kartu Keluarga"
                  value={
                    <Link
                      href={`/keluarga/${resident.family.id}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Home className="h-4 w-4" />
                      {resident.family.familyCardNumber}
                    </Link>
                  }
                />
                <InfoItem label="Alamat" value={resident.family.address} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoItem label="RT/RW" value={`${resident.family.rt}/${resident.family.rw}`} />
                  <InfoItem label="Kelurahan" value={resident.family.village} />
                  <InfoItem label="Kecamatan" value={resident.family.district} />
                  <InfoItem label="Kota" value={resident.family.city} />
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Belum terdaftar dalam Kartu Keluarga
              </p>
            )}
            <Separator />
            <InfoItem
              label="Status dalam Keluarga"
              value={familyStatusLabels[resident.familyStatus || '']}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontak & Informasi Lain</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="No. HP" value={resident.phone} />
            <InfoItem label="Email" value={resident.email} />
            <InfoItem
              label="Tanggal Masuk"
              value={
                resident.entryDate
                  ? format(new Date(resident.entryDate), 'd MMMM yyyy', {
                      locale: id,
                    })
                  : null
              }
            />
            <InfoItem
              label="Tanggal Keluar"
              value={
                resident.exitDate
                  ? format(new Date(resident.exitDate), 'd MMMM yyyy', {
                      locale: id,
                    })
                  : null
              }
            />
            {resident.notes && (
              <div className="sm:col-span-2">
                <InfoItem label="Catatan" value={resident.notes} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
