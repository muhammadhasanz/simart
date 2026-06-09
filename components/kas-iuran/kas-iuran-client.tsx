'use client'

import { useState, useTransition } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Loader2,
} from 'lucide-react'
import {
  createKasIuran,
  updateKasIuran,
  deleteKasIuran,
  getKasIuranList,
} from '@/app/actions/kas-iuran'
import type { KasIuran } from '@/lib/db/schema'

type Props = {
  initialData: KasIuran[]
}

const emptyForm = {
  nama: '',
  keterangan: '',
  nominal: '',
  jenis: 'masuk' as 'masuk' | 'keluar',
  tanggal: new Date().toISOString().split('T')[0],
}

function formatRupiah(val: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val)
}

export function KasIuranClient({ initialData }: Props) {
  const [items, setItems] = useState<KasIuran[]>(initialData)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<KasIuran | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<KasIuran | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const totalMasuk = items
    .filter((i) => i.jenis === 'masuk')
    .reduce((s, i) => s + i.nominal, 0)
  const totalKeluar = items
    .filter((i) => i.jenis === 'keluar')
    .reduce((s, i) => s + i.nominal, 0)
  const saldo = totalMasuk - totalKeluar

  async function refreshData() {
    const fresh = await getKasIuranList()
    setItems(fresh)
  }

  function openAdd() {
    setEditTarget(null)
    setForm(emptyForm)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(item: KasIuran) {
    setEditTarget(item)
    setForm({
      nama: item.nama,
      keterangan: item.keterangan ?? '',
      nominal: String(item.nominal),
      jenis: (item.jenis as 'masuk' | 'keluar') ?? 'masuk',
      tanggal: item.tanggal ?? new Date().toISOString().split('T')[0],
    })
    setErrors({})
    setDialogOpen(true)
  }

  function openDelete(item: KasIuran) {
    setDeleteTarget(item)
    setDeleteDialogOpen(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.nama.trim()) e.nama = 'Nama tidak boleh kosong.'
    if (!form.nominal || isNaN(Number(form.nominal)) || Number(form.nominal) <= 0)
      e.nominal = 'Nominal harus berupa angka positif.'
    if (!form.tanggal) e.tanggal = 'Tanggal wajib diisi.'
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    startTransition(async () => {
      try {
        if (editTarget) {
          await updateKasIuran(editTarget.id, {
            nama: form.nama.trim(),
            keterangan: form.keterangan.trim() || null,
            nominal: Number(form.nominal),
            jenis: form.jenis,
            tanggal: form.tanggal,
          })
        } else {
          await createKasIuran({
            nama: form.nama.trim(),
            keterangan: form.keterangan.trim() || null,
            nominal: Number(form.nominal),
            jenis: form.jenis,
            tanggal: form.tanggal,
          })
        }
        await refreshData()
        setDialogOpen(false)
      } catch {
        setErrors({ _global: 'Terjadi kesalahan. Coba lagi.' })
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteKasIuran(deleteTarget.id)
        await refreshData()
        setDeleteDialogOpen(false)
        setDeleteTarget(null)
      } catch {
        setErrors({ _global: 'Gagal menghapus. Coba lagi.' })
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pemasukan</CardDescription>
            <CardTitle className="text-2xl text-primary flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {formatRupiah(totalMasuk)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pengeluaran</CardDescription>
            <CardTitle className="text-2xl text-destructive flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              {formatRupiah(totalKeluar)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo Kas</CardDescription>
            <CardTitle
              className={`text-2xl flex items-center gap-2 ${saldo >= 0 ? 'text-primary' : 'text-destructive'}`}
            >
              <Wallet className="h-5 w-5" />
              {formatRupiah(saldo)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table card */}
      <Card>
        <CardHeader className="border-b flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Kas & Iuran</CardTitle>
            <CardDescription>{items.length} transaksi tercatat</CardDescription>
          </div>
          <Button onClick={openAdd} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Wallet className="h-10 w-10 opacity-30" />
              <p className="text-sm">Belum ada data kas/iuran.</p>
              <Button variant="outline" size="sm" onClick={openAdd}>
                Tambah Pertama
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                    <th className="px-4 py-3 text-left font-medium">Nama / Keterangan</th>
                    <th className="px-4 py-3 text-left font-medium">Jenis</th>
                    <th className="px-4 py-3 text-right font-medium">Nominal</th>
                    <th className="px-4 py-3 text-center font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {item.tanggal
                          ? new Date(item.tanggal).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{item.nama}</p>
                        {item.keterangan && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.keterangan}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={item.jenis === 'masuk' ? 'default' : 'destructive'}
                        >
                          {item.jenis === 'masuk' ? 'Masuk' : 'Keluar'}
                        </Badge>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                          item.jenis === 'masuk' ? 'text-primary' : 'text-destructive'
                        }`}
                      >
                        {item.jenis === 'masuk' ? '+' : '-'}
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(item)}
                            className="h-8 w-8 p-0"
                            disabled={isPending}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDelete(item)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            disabled={isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Hapus</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !isPending && setDialogOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Item' : 'Tambah Item Kas/Iuran'}</DialogTitle>
            <DialogDescription>
              Isi detail transaksi kas atau iuran di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {errors._global && (
              <p className="text-sm text-destructive">{errors._global}</p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ki-nama">Nama / Keterangan Singkat</Label>
              <Input
                id="ki-nama"
                placeholder="cth. Iuran Keamanan"
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                disabled={isPending}
              />
              {errors.nama && (
                <p className="text-xs text-destructive">{errors.nama}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ki-ket">Keterangan (opsional)</Label>
              <Textarea
                id="ki-ket"
                placeholder="Deskripsi lebih lanjut..."
                rows={2}
                value={form.keterangan}
                onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
                disabled={isPending}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ki-nominal">Nominal (Rp)</Label>
                <Input
                  id="ki-nominal"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.nominal}
                  onChange={(e) => setForm((f) => ({ ...f, nominal: e.target.value }))}
                  disabled={isPending}
                />
                {errors.nominal && (
                  <p className="text-xs text-destructive">{errors.nominal}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ki-tanggal">Tanggal</Label>
                <Input
                  id="ki-tanggal"
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                  disabled={isPending}
                />
                {errors.tanggal && (
                  <p className="text-xs text-destructive">{errors.tanggal}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Jenis Transaksi</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={form.jenis === 'masuk' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setForm((f) => ({ ...f, jenis: 'masuk' }))}
                  disabled={isPending}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Masuk
                </Button>
                <Button
                  type="button"
                  variant={form.jenis === 'keluar' ? 'destructive' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setForm((f) => ({ ...f, jenis: 'keluar' }))}
                  disabled={isPending}
                >
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Keluar
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : editTarget ? (
                'Simpan Perubahan'
              ) : (
                'Tambah'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(o) => !isPending && setDeleteDialogOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Item</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus{' '}
              <span className="font-semibold">{deleteTarget?.nama}</span>? Tindakan ini
              tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
