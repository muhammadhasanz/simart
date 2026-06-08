'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Plus, Eye, Pencil, Trash2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { deleteFamily } from '@/app/actions/families'
import type { Family } from '@/lib/db/schema'

interface FamilyTableProps {
  initialData: (Family & { memberCount: number })[]
  total: number
}

export function FamilyTable({ initialData, total }: FamilyTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [familyToDelete, setFamilyToDelete] = useState<Family | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSearch = (value: string) => {
    setSearch(value)
    const params = new URLSearchParams()
    if (value) params.set('search', value)
    router.push(`/keluarga?${params.toString()}`)
  }

  const handleDelete = async () => {
    if (!familyToDelete) return
    setIsDeleting(true)
    await deleteFamily(familyToDelete.id)
    setIsDeleting(false)
    setDeleteDialogOpen(false)
    setFamilyToDelete(null)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari No. KK atau alamat..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/keluarga/tambah">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Keluarga
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Kartu Keluarga</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead className="hidden md:table-cell">RT/RW</TableHead>
              <TableHead className="hidden lg:table-cell">Kelurahan</TableHead>
              <TableHead>Jumlah Anggota</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Tidak ada data keluarga ditemukan
                </TableCell>
              </TableRow>
            ) : (
              initialData.map((family) => (
                <TableRow key={family.id}>
                  <TableCell className="font-mono font-medium">
                    {family.familyCardNumber}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {family.address}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {family.rt}/{family.rw}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {family.village || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {family.memberCount}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/keluarga/${family.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Lihat</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/keluarga/${family.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFamilyToDelete(family)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Hapus</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Menampilkan {initialData.length} dari {total} data keluarga
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Data Keluarga</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data keluarga dengan No. KK{' '}
              <span className="font-mono font-semibold">{familyToDelete?.familyCardNumber}</span>?
              Tindakan ini tidak dapat dibatalkan. Anggota keluarga tidak akan terhapus, namun hubungan dengan KK ini akan terputus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
