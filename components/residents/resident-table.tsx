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
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { deleteResident } from '@/app/actions/residents'
import type { Resident, Family } from '@/lib/db/schema'

interface ResidentTableProps {
  initialData: (Resident & { family: Family | null })[]
  total: number
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

export function ResidentTable({ initialData, total }: ResidentTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [genderFilter, setGenderFilter] = useState('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [residentToDelete, setResidentToDelete] = useState<Resident | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSearch = (value: string) => {
    setSearch(value)
    const params = new URLSearchParams()
    if (value) params.set('search', value)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (genderFilter !== 'all') params.set('gender', genderFilter)
    router.push(`/warga?${params.toString()}`)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (value !== 'all') params.set('status', value)
    if (genderFilter !== 'all') params.set('gender', genderFilter)
    router.push(`/warga?${params.toString()}`)
  }

  const handleGenderFilter = (value: string) => {
    setGenderFilter(value)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (value !== 'all') params.set('gender', value)
    router.push(`/warga?${params.toString()}`)
  }

  const handleDelete = async () => {
    if (!residentToDelete) return
    setIsDeleting(true)
    await deleteResident(residentToDelete.id)
    setIsDeleting(false)
    setDeleteDialogOpen(false)
    setResidentToDelete(null)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau NIK..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="moved">Pindah</SelectItem>
              <SelectItem value="deceased">Meninggal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={genderFilter} onValueChange={handleGenderFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Gender</SelectItem>
              <SelectItem value="male">Laki-laki</SelectItem>
              <SelectItem value="female">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link href="/warga/tambah" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Warga
        </Link>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>NIK</TableHead>
              <TableHead className="hidden md:table-cell">Jenis Kelamin</TableHead>
              <TableHead className="hidden lg:table-cell">Tanggal Lahir</TableHead>
              <TableHead className="hidden lg:table-cell">No. KK</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Tidak ada data warga ditemukan
                </TableCell>
              </TableRow>
            ) : (
              initialData.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell className="font-medium">{resident.fullName}</TableCell>
                  <TableCell className="font-mono text-sm">{resident.nik}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {genderLabels[resident.gender || ''] || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {resident.birthDate
                      ? format(new Date(resident.birthDate), 'd MMM yyyy', { locale: id })
                      : '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-sm">
                    {resident.family?.familyCardNumber || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[resident.residentStatus || 'active']}>
                      {statusLabels[resident.residentStatus || 'active']}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/warga/${resident.id}`} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Lihat</span>
                      </Link>
                      <Link href={`/warga/${resident.id}/edit`} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setResidentToDelete(resident)
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
        Menampilkan {initialData.length} dari {total} data warga
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Data Warga</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data warga{' '}
              <span className="font-semibold">{residentToDelete?.fullName}</span>?
              Tindakan ini tidak dapat dibatalkan.
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
