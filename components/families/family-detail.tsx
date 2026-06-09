import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Pencil, UserPlus, MapPin } from 'lucide-react'
import type { Family, Resident } from '@/lib/db/schema'

interface FamilyDetailProps {
  family: Family & { members: Resident[] }
}

const genderLabels: Record<string, string> = {
  male: 'Laki-laki',
  female: 'Perempuan',
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

export function FamilyDetail({ family }: FamilyDetailProps) {
  // Sort members - head of family first
  const sortedMembers = [...family.members].sort((a, b) => {
    if (a.familyStatus === 'kepala_keluarga') return -1
    if (b.familyStatus === 'kepala_keluarga') return 1
    return 0
  })

  const headOfFamily = sortedMembers.find(
    (m) => m.familyStatus === 'kepala_keluarga'
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/keluarga" className={buttonVariants({ variant: 'outline', size: 'icon' })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Kartu Keluarga</h1>
            <p className="text-muted-foreground font-mono text-lg">
              {family.familyCardNumber}
            </p>
          </div>
        </div>
        <Link href={`/keluarga/${family.id}/edit`} className={buttonVariants()}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Keluarga</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <InfoItem
              label="Kepala Keluarga"
              value={headOfFamily?.fullName || 'Belum diset'}
            />
            <InfoItem label="Jumlah Anggota" value={`${family.members.length} orang`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Alamat
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <InfoItem label="Alamat Lengkap" value={family.address} />
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="RT/RW" value={`${family.rt}/${family.rw}`} />
              <InfoItem label="Kode Pos" value={family.postalCode} />
              <InfoItem label="Kelurahan/Desa" value={family.village} />
              <InfoItem label="Kecamatan" value={family.district} />
              <InfoItem label="Kota/Kabupaten" value={family.city} />
              <InfoItem label="Provinsi" value={family.province} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Anggota Keluarga</CardTitle>
          <Link href={`/warga/tambah?familyId=${family.id}`} className={buttonVariants({ size: 'sm' })}>
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah Anggota
          </Link>
        </CardHeader>
        <CardContent>
          {sortedMembers.length === 0 ? (
            <div className="flex h-[100px] items-center justify-center text-sm text-muted-foreground">
              Belum ada anggota keluarga terdaftar
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead className="hidden md:table-cell">Jenis Kelamin</TableHead>
                  <TableHead>Status dalam Keluarga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/warga/${member.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {member.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {member.nik}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {genderLabels[member.gender || ''] || '-'}
                    </TableCell>
                    <TableCell>
                      {member.familyStatus === 'kepala_keluarga' ? (
                        <Badge>{familyStatusLabels[member.familyStatus]}</Badge>
                      ) : (
                        familyStatusLabels[member.familyStatus || ''] || '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
