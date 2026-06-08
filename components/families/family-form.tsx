'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createFamily, updateFamily } from '@/app/actions/families'
import type { Family } from '@/lib/db/schema'

interface FamilyFormProps {
  family?: Family | null
  mode: 'create' | 'edit'
}

export function FamilyForm({ family, mode }: FamilyFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      familyCardNumber: formData.get('familyCardNumber') as string,
      address: formData.get('address') as string,
      rt: formData.get('rt') as string || '001',
      rw: formData.get('rw') as string || '001',
      village: formData.get('village') as string,
      district: formData.get('district') as string,
      city: formData.get('city') as string,
      province: formData.get('province') as string,
      postalCode: formData.get('postalCode') as string,
    }

    // Validate family card number
    if (!/^\d{16}$/.test(data.familyCardNumber)) {
      setError('No. Kartu Keluarga harus 16 digit angka')
      setIsSubmitting(false)
      return
    }

    try {
      if (mode === 'create') {
        await createFamily(data)
      } else if (family) {
        await updateFamily(family.id, data)
      }
      router.push('/keluarga')
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
          <CardTitle className="text-base">Identitas Kartu Keluarga</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="familyCardNumber">No. Kartu Keluarga *</Label>
            <Input
              id="familyCardNumber"
              name="familyCardNumber"
              defaultValue={family?.familyCardNumber || ''}
              placeholder="Masukkan 16 digit No. KK"
              required
              maxLength={16}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="address">Alamat Lengkap *</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={family?.address || ''}
              placeholder="Masukkan alamat lengkap (nama jalan, nomor rumah, dll)"
              required
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wilayah Administratif</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rt">RT</Label>
            <Input
              id="rt"
              name="rt"
              defaultValue={family?.rt || '001'}
              placeholder="001"
              maxLength={3}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rw">RW</Label>
            <Input
              id="rw"
              name="rw"
              defaultValue={family?.rw || '001'}
              placeholder="001"
              maxLength={3}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="village">Kelurahan/Desa</Label>
            <Input
              id="village"
              name="village"
              defaultValue={family?.village || ''}
              placeholder="Masukkan kelurahan/desa"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="district">Kecamatan</Label>
            <Input
              id="district"
              name="district"
              defaultValue={family?.district || ''}
              placeholder="Masukkan kecamatan"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="city">Kota/Kabupaten</Label>
            <Input
              id="city"
              name="city"
              defaultValue={family?.city || ''}
              placeholder="Masukkan kota/kabupaten"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="province">Provinsi</Label>
            <Input
              id="province"
              name="province"
              defaultValue={family?.province || ''}
              placeholder="Masukkan provinsi"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="postalCode">Kode Pos</Label>
            <Input
              id="postalCode"
              name="postalCode"
              defaultValue={family?.postalCode || ''}
              placeholder="Masukkan kode pos"
              maxLength={5}
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
              ? 'Simpan Keluarga'
              : 'Perbarui Keluarga'}
        </Button>
      </div>
    </form>
  )
}
