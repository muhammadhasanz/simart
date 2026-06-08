'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createResident, updateResident } from '@/app/actions/residents'
import type { Resident, Family } from '@/lib/db/schema'

interface ResidentFormProps {
  resident?: Resident | null
  families: { id: number; familyCardNumber: string; address: string }[]
  mode: 'create' | 'edit'
}

const religions = [
  { value: 'islam', label: 'Islam' },
  { value: 'kristen', label: 'Kristen' },
  { value: 'katolik', label: 'Katolik' },
  { value: 'hindu', label: 'Hindu' },
  { value: 'buddha', label: 'Buddha' },
  { value: 'konghucu', label: 'Konghucu' },
]

const maritalStatuses = [
  { value: 'belum_kawin', label: 'Belum Kawin' },
  { value: 'kawin', label: 'Kawin' },
  { value: 'cerai_hidup', label: 'Cerai Hidup' },
  { value: 'cerai_mati', label: 'Cerai Mati' },
]

const educationLevels = [
  { value: 'tidak_sekolah', label: 'Tidak/Belum Sekolah' },
  { value: 'sd', label: 'SD/Sederajat' },
  { value: 'smp', label: 'SMP/Sederajat' },
  { value: 'sma', label: 'SMA/Sederajat' },
  { value: 'd1_d2', label: 'Diploma I/II' },
  { value: 'd3', label: 'Diploma III' },
  { value: 's1_d4', label: 'S1/Diploma IV' },
  { value: 's2', label: 'S2' },
  { value: 's3', label: 'S3' },
]

const familyStatuses = [
  { value: 'kepala_keluarga', label: 'Kepala Keluarga' },
  { value: 'istri', label: 'Istri' },
  { value: 'anak', label: 'Anak' },
  { value: 'menantu', label: 'Menantu' },
  { value: 'cucu', label: 'Cucu' },
  { value: 'orang_tua', label: 'Orang Tua' },
  { value: 'mertua', label: 'Mertua' },
  { value: 'famili_lain', label: 'Famili Lain' },
  { value: 'pembantu', label: 'Pembantu' },
  { value: 'lainnya', label: 'Lainnya' },
]

const bloodTypes = ['A', 'B', 'AB', 'O']

export function ResidentForm({ resident, families, mode }: ResidentFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      nik: formData.get('nik') as string,
      fullName: formData.get('fullName') as string,
      birthPlace: formData.get('birthPlace') as string,
      birthDate: formData.get('birthDate') as string || null,
      gender: formData.get('gender') as string,
      bloodType: formData.get('bloodType') as string || null,
      religion: formData.get('religion') as string,
      maritalStatus: formData.get('maritalStatus') as string,
      occupation: formData.get('occupation') as string,
      education: formData.get('education') as string,
      nationality: formData.get('nationality') as string || 'WNI',
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      familyId: formData.get('familyId') ? Number(formData.get('familyId')) : null,
      familyStatus: formData.get('familyStatus') as string,
      residentStatus: formData.get('residentStatus') as string || 'active',
      notes: formData.get('notes') as string,
    }

    // Validate NIK
    if (!/^\d{16}$/.test(data.nik)) {
      setError('NIK harus 16 digit angka')
      setIsSubmitting(false)
      return
    }

    try {
      if (mode === 'create') {
        await createResident(data)
      } else if (resident) {
        await updateResident(resident.id, data)
      }
      router.push('/warga')
      router.refresh()
    } catch (err) {
      setError('Terjadi kesalahan saat menyimpan data')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Pribadi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nik">NIK *</Label>
            <Input
              id="nik"
              name="nik"
              defaultValue={resident?.nik || ''}
              placeholder="Masukkan 16 digit NIK"
              required
              maxLength={16}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Nama Lengkap *</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={resident?.fullName || ''}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="birthPlace">Tempat Lahir</Label>
            <Input
              id="birthPlace"
              name="birthPlace"
              defaultValue={resident?.birthPlace || ''}
              placeholder="Masukkan tempat lahir"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="birthDate">Tanggal Lahir</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              defaultValue={resident?.birthDate || ''}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="gender">Jenis Kelamin *</Label>
            <Select name="gender" defaultValue={resident?.gender || ''} required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Laki-laki</SelectItem>
                <SelectItem value="female">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bloodType">Golongan Darah</Label>
            <Select name="bloodType" defaultValue={resident?.bloodType || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih golongan darah" />
              </SelectTrigger>
              <SelectContent>
                {bloodTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="religion">Agama</Label>
            <Select name="religion" defaultValue={resident?.religion || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih agama" />
              </SelectTrigger>
              <SelectContent>
                {religions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="maritalStatus">Status Perkawinan</Label>
            <Select name="maritalStatus" defaultValue={resident?.maritalStatus || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih status perkawinan" />
              </SelectTrigger>
              <SelectContent>
                {maritalStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pendidikan & Pekerjaan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="education">Pendidikan Terakhir</Label>
            <Select name="education" defaultValue={resident?.education || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih pendidikan terakhir" />
              </SelectTrigger>
              <SelectContent>
                {educationLevels.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="occupation">Pekerjaan</Label>
            <Input
              id="occupation"
              name="occupation"
              defaultValue={resident?.occupation || ''}
              placeholder="Masukkan pekerjaan"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Keluarga</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="familyId">Kartu Keluarga</Label>
            <Select
              name="familyId"
              defaultValue={resident?.familyId?.toString() || ''}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kartu Keluarga" />
              </SelectTrigger>
              <SelectContent>
                {families.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.familyCardNumber} - {f.address.substring(0, 30)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="familyStatus">Status dalam Keluarga</Label>
            <Select name="familyStatus" defaultValue={resident?.familyStatus || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih status dalam keluarga" />
              </SelectTrigger>
              <SelectContent>
                {familyStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kontak & Lainnya</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">No. HP</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={resident?.phone || ''}
              placeholder="Masukkan nomor HP"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={resident?.email || ''}
              placeholder="Masukkan email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nationality">Kewarganegaraan</Label>
            <Input
              id="nationality"
              name="nationality"
              defaultValue={resident?.nationality || 'WNI'}
              placeholder="Masukkan kewarganegaraan"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="residentStatus">Status Warga</Label>
            <Select
              name="residentStatus"
              defaultValue={resident?.residentStatus || 'active'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status warga" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="moved">Pindah</SelectItem>
                <SelectItem value="deceased">Meninggal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={resident?.notes || ''}
              placeholder="Tambahkan catatan (opsional)"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Menyimpan...'
            : mode === 'create'
              ? 'Simpan Warga'
              : 'Perbarui Warga'}
        </Button>
      </div>
    </form>
  )
}
