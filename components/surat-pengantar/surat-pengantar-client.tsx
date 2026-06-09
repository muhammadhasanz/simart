'use client'

import { useState, useRef, useTransition } from 'react'
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
  Printer,
  FileText,
  Loader2,
} from 'lucide-react'
import {
  createSuratPengantar,
  updateSuratPengantar,
  deleteSuratPengantar,
  getSuratPengantarList,
} from '@/app/actions/surat-pengantar'
import type { SuratPengantar } from '@/lib/db/schema'

type Props = {
  initialData: SuratPengantar[]
}

const emptyForm = {
  nomorSurat: '',
  tujuan: '',
  perihal: '',
  penerima: '',
  nik: '',
  phone: '',
  nomorRumah: '',
  tanggal: new Date().toISOString().split('T')[0],
  status: 'menunggu',
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

export function SuratPengantarClient({ initialData }: Props) {
  const [suratList, setSuratList] = useState<SuratPengantar[]>(initialData)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SuratPengantar | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SuratPengantar | null>(null)
  const [printTarget, setPrintTarget] = useState<SuratPengantar | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const printRef = useRef<HTMLDivElement>(null)

  async function refreshData() {
    const fresh = await getSuratPengantarList()
    setSuratList(fresh)
  }

  function openAdd() {
    setEditTarget(null)
    setForm(emptyForm)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(surat: SuratPengantar) {
    setEditTarget(surat)
    setForm({
      nomorSurat: surat.nomorSurat,
      tujuan: surat.tujuan,
      perihal: surat.perihal,
      penerima: surat.penerima,
      nik: surat.nik ?? '',
      phone: surat.phone ?? '',
      nomorRumah: surat.nomorRumah ?? '',
      tanggal: surat.tanggal ?? new Date().toISOString().split('T')[0],
      status: surat.status ?? 'menunggu',
    })
    setErrors({})
    setDialogOpen(true)
  }

  function openDelete(surat: SuratPengantar) {
    setDeleteTarget(surat)
    setDeleteDialogOpen(true)
  }

  function openPrint(surat: SuratPengantar) {
    setPrintTarget(surat)
    setPrintDialogOpen(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.nomorSurat.trim()) e.nomorSurat = 'Nomor surat wajib diisi.'
    if (!form.tujuan.trim()) e.tujuan = 'Tujuan surat wajib diisi.'
    if (!form.perihal.trim()) e.perihal = 'Perihal wajib diisi.'
    if (!form.penerima.trim()) e.penerima = 'Nama penerima wajib diisi.'
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
        const payload = {
          nomorSurat: form.nomorSurat.trim(),
          tujuan: form.tujuan.trim(),
          perihal: form.perihal.trim(),
          penerima: form.penerima.trim(),
          nik: form.nik.trim() || null,
          phone: form.phone.trim() || null,
          nomorRumah: form.nomorRumah.trim() || null,
          tanggal: form.tanggal,
          status: (form.status || 'menunggu') as 'menunggu' | 'selesai' | 'ditolak',
        }
        if (editTarget) {
          await updateSuratPengantar(editTarget.id, payload)
        } else {
          await createSuratPengantar(payload)
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
        await deleteSuratPengantar(deleteTarget.id)
        await refreshData()
        setDeleteDialogOpen(false)
        setDeleteTarget(null)
      } catch {
        setErrors({ _global: 'Gagal menghapus. Coba lagi.' })
      }
    })
  }

  function handlePrint() {
    const printContents = printRef.current?.innerHTML
    if (!printContents) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <title>Surat Pengantar</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 0; padding: 2cm; color: #000; }
            .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 20px; }
            .header h1 { font-size: 16pt; font-weight: bold; margin: 0 0 4px; }
            .header p { margin: 2px 0; font-size: 11pt; }
            .title { text-align: center; margin: 24px 0 20px; }
            .title h2 { font-size: 14pt; font-weight: bold; text-decoration: underline; letter-spacing: 2px; }
            .title .nomor { font-size: 11pt; margin-top: 4px; }
            table.meta { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            table.meta td { padding: 4px 8px; vertical-align: top; font-size: 11pt; }
            table.meta td:first-child { width: 160px; }
            table.meta td:nth-child(2) { width: 12px; }
            .body-text { text-align: justify; line-height: 1.8; margin-bottom: 24px; font-size: 11pt; }
            .sign { margin-top: 40px; display: flex; justify-content: flex-end; }
            .sign-block { text-align: center; }
            .sign-block .space { height: 70px; }
            .sign-block p { margin: 0; font-size: 11pt; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="border-b flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Surat Pengantar</CardTitle>
            <CardDescription>{suratList.length} surat tersimpan</CardDescription>
          </div>
          <Button onClick={openAdd} size="sm" className="gap-2" disabled={isPending}>
            <Plus className="h-4 w-4" />
            Buat Surat
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {suratList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm">Belum ada surat pengantar.</p>
              <Button variant="outline" size="sm" onClick={openAdd}>
                Buat Surat Pertama
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">No. Surat</th>
                    <th className="px-4 py-3 text-left font-medium">Perihal</th>
                    <th className="px-4 py-3 text-left font-medium">Penerima</th>
                    <th className="px-4 py-3 text-left font-medium">Tujuan</th>
                    <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-center font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {suratList.map((surat) => (
                    <tr
                      key={surat.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {surat.nomorSurat}
                      </td>
                      <td className="px-4 py-3 font-medium">{surat.perihal}</td>
                      <td className="px-4 py-3">{surat.penerima}</td>
                      <td className="px-4 py-3 text-muted-foreground">{surat.tujuan}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {surat.tanggal ? formatDate(surat.tanggal) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            surat.status === 'selesai'
                              ? 'default'
                              : surat.status === 'ditolak'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {surat.status === 'selesai'
                            ? 'Selesai'
                            : surat.status === 'ditolak'
                            ? 'Ditolak'
                            : 'Menunggu'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPrint(surat)}
                            className="h-8 w-8 p-0"
                            title="Cetak/Download"
                            disabled={isPending}
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span className="sr-only">Cetak</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(surat)}
                            className="h-8 w-8 p-0"
                            disabled={isPending}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDelete(surat)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? 'Edit Surat Pengantar' : 'Buat Surat Pengantar Baru'}
            </DialogTitle>
            <DialogDescription>
              Lengkapi data surat pengantar berikut.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {errors._global && (
              <p className="text-sm text-destructive">{errors._global}</p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-nomor">Nomor Surat</Label>
              <Input
                id="sp-nomor"
                placeholder="cth. 001/RT.05/VI/2025"
                value={form.nomorSurat}
                onChange={(e) => setForm((f) => ({ ...f, nomorSurat: e.target.value }))}
                disabled={isPending}
              />
              {errors.nomorSurat && (
                <p className="text-xs text-destructive">{errors.nomorSurat}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-penerima">Nama Penerima</Label>
              <Input
                id="sp-penerima"
                placeholder="Nama lengkap warga"
                value={form.penerima}
                onChange={(e) => setForm((f) => ({ ...f, penerima: e.target.value }))}
                disabled={isPending}
              />
              {errors.penerima && (
                <p className="text-xs text-destructive">{errors.penerima}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sp-nik-admin">NIK</Label>
                <Input
                  id="sp-nik-admin"
                  placeholder="16 digit"
                  value={form.nik}
                  onChange={(e) => setForm((f) => ({ ...f, nik: e.target.value }))}
                  disabled={isPending}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sp-phone-admin">No. HP</Label>
                <Input
                  id="sp-phone-admin"
                  placeholder="08xx"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  disabled={isPending}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sp-rumah-admin">No. Rumah</Label>
                <Input
                  id="sp-rumah-admin"
                  placeholder="cth. 12A"
                  value={form.nomorRumah}
                  onChange={(e) => setForm((f) => ({ ...f, nomorRumah: e.target.value }))}
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-status-admin">Status</Label>
              <select
                id="sp-status-admin"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                disabled={isPending}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="menunggu">Menunggu</option>
                <option value="selesai">Selesai</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-tujuan">Tujuan Surat</Label>
              <Input
                id="sp-tujuan"
                placeholder="cth. Kelurahan Sukamaju"
                value={form.tujuan}
                onChange={(e) => setForm((f) => ({ ...f, tujuan: e.target.value }))}
                disabled={isPending}
              />
              {errors.tujuan && (
                <p className="text-xs text-destructive">{errors.tujuan}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-perihal">Perihal</Label>
              <Textarea
                id="sp-perihal"
                placeholder="cth. Keterangan Domisili"
                rows={2}
                value={form.perihal}
                onChange={(e) => setForm((f) => ({ ...f, perihal: e.target.value }))}
                disabled={isPending}
              />
              {errors.perihal && (
                <p className="text-xs text-destructive">{errors.perihal}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-tanggal">Tanggal Surat</Label>
              <Input
                id="sp-tanggal"
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
                'Buat Surat'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(o) => !isPending && setDeleteDialogOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Surat</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus surat{' '}
              <span className="font-semibold">{deleteTarget?.nomorSurat}</span>?
              Tindakan ini tidak dapat dibatalkan.
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

      {/* Print Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pratinjau Surat Pengantar</DialogTitle>
            <DialogDescription>
              Periksa tampilan surat sebelum mencetak.
            </DialogDescription>
          </DialogHeader>
          <div
            ref={printRef}
            className="border rounded-lg p-8 bg-white text-black text-sm leading-relaxed font-serif max-h-[60vh] overflow-y-auto"
          >
            {printTarget && (
              <>
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                  <h1 className="text-lg font-bold uppercase tracking-wide">
                    Rukun Tetangga 05
                  </h1>
                  <p className="text-sm">Desa / Kelurahan Sukamaju, Kecamatan Ciputat</p>
                  <p className="text-sm">Kota Tangerang Selatan, Banten 15411</p>
                </div>
                <div className="text-center mb-6">
                  <h2 className="text-base font-bold uppercase tracking-widest underline">
                    Surat Pengantar
                  </h2>
                  <p className="text-sm mt-1">Nomor: {printTarget.nomorSurat}</p>
                </div>
                <table className="w-full text-sm mb-6">
                  <tbody>
                    <tr>
                      <td className="w-36 align-top py-1">Kepada Yth.</td>
                      <td className="w-3 align-top py-1">:</td>
                      <td className="align-top py-1">{printTarget.tujuan}</td>
                    </tr>
                    <tr>
                      <td className="align-top py-1">Perihal</td>
                      <td className="align-top py-1">:</td>
                      <td className="align-top py-1">{printTarget.perihal}</td>
                    </tr>
                    <tr>
                      <td className="align-top py-1">Tanggal</td>
                      <td className="align-top py-1">:</td>
                      <td className="align-top py-1">
                        {printTarget.tanggal ? formatDate(printTarget.tanggal) : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-sm leading-7 mb-4 text-justify">
                  Yang bertanda tangan di bawah ini, Ketua Rukun Tetangga 05, dengan ini
                  menerangkan bahwa:
                </p>
                <table className="w-full text-sm mb-4 ml-4">
                  <tbody>
                    <tr>
                      <td className="w-36 py-0.5">Nama</td>
                      <td className="w-3 py-0.5">:</td>
                      <td className="py-0.5 font-semibold">{printTarget.penerima}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Keterangan</td>
                      <td className="py-0.5">:</td>
                      <td className="py-0.5">{printTarget.perihal}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-sm leading-7 mb-8 text-justify">
                  Adalah benar merupakan warga yang berdomisili di wilayah RT 05. Surat
                  pengantar ini dibuat untuk keperluan yang bersangkutan. Atas perhatian dan
                  kerjasamanya, kami ucapkan terima kasih.
                </p>
                <div className="flex justify-end">
                  <div className="text-center text-sm">
                    <p>
                      Tangerang Selatan,{' '}
                      {printTarget.tanggal ? formatDate(printTarget.tanggal) : '-'}
                    </p>
                    <p className="mt-1">Ketua RT 05,</p>
                    <div className="h-16" />
                    <p className="font-semibold underline">(__________________)</p>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
              Tutup
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Cetak / Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
