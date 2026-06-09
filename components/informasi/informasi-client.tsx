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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  BarChart2,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react'
import {
  getPengumumanList,
  createPengumuman,
  updatePengumuman,
  deletePengumuman,
  getPollsWithOptions,
  createPoll,
  castVote,
  deletePoll,
  type PollWithOptions,
} from '@/app/actions/informasi'
import type { Pengumuman } from '@/lib/db/schema'

// ── Types ────────────────────────────────────────────────────────────────────

type Props = {
  initialPengumuman: Pengumuman[]
  initialPolls: PollWithOptions[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const kategoriVariant: Record<string, 'default' | 'destructive' | 'secondary'> = {
  penting: 'destructive',
  acara: 'default',
  umum: 'secondary',
}

const kategoriLabel: Record<string, string> = {
  penting: 'Penting',
  acara: 'Acara',
  umum: 'Umum',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ── Root Component ────────────────────────────────────────────────────────────

export function InformasiClient({ initialPengumuman, initialPolls }: Props) {
  return (
    <Tabs defaultValue="pengumuman">
      <TabsList className="mb-2">
        <TabsTrigger value="pengumuman">Pengumuman</TabsTrigger>
        <TabsTrigger value="polling">Polling</TabsTrigger>
      </TabsList>
      <TabsContent value="pengumuman">
        <PengumumanPanel initialItems={initialPengumuman} />
      </TabsContent>
      <TabsContent value="polling">
        <PollingPanel initialPolls={initialPolls} />
      </TabsContent>
    </Tabs>
  )
}

// ── Pengumuman ────────────────────────────────────────────────────────────────

function PengumumanPanel({ initialItems }: { initialItems: Pengumuman[] }) {
  const [items, setItems] = useState<Pengumuman[]>(initialItems)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Pengumuman | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Pengumuman | null>(null)
  const [form, setForm] = useState({
    judul: '',
    isi: '',
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'umum' as string,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  async function refreshData() {
    const fresh = await getPengumumanList()
    setItems(fresh)
  }

  function openAdd() {
    setEditTarget(null)
    setForm({
      judul: '',
      isi: '',
      tanggal: new Date().toISOString().split('T')[0],
      kategori: 'umum',
    })
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(item: Pengumuman) {
    setEditTarget(item)
    setForm({
      judul: item.judul,
      isi: item.isi,
      tanggal: item.tanggal ?? new Date().toISOString().split('T')[0],
      kategori: item.kategori ?? 'umum',
    })
    setErrors({})
    setDialogOpen(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.judul.trim()) e.judul = 'Judul tidak boleh kosong.'
    if (!form.isi.trim()) e.isi = 'Isi pengumuman tidak boleh kosong.'
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
          await updatePengumuman(editTarget.id, {
            judul: form.judul.trim(),
            isi: form.isi.trim(),
            tanggal: form.tanggal,
            kategori: form.kategori,
          })
        } else {
          await createPengumuman({
            judul: form.judul.trim(),
            isi: form.isi.trim(),
            tanggal: form.tanggal,
            kategori: form.kategori,
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
        await deletePengumuman(deleteTarget.id)
        await refreshData()
        setDeleteDialogOpen(false)
        setDeleteTarget(null)
      } catch {
        setErrors({ _global: 'Gagal menghapus. Coba lagi.' })
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} pengumuman aktif</p>
        <Button size="sm" onClick={openAdd} className="gap-2" disabled={isPending}>
          <Plus className="h-4 w-4" />
          Buat Pengumuman
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <Megaphone className="h-10 w-10 opacity-30" />
          <p className="text-sm">Belum ada pengumuman.</p>
          <Button variant="outline" size="sm" onClick={openAdd}>
            Buat Pengumuman Pertama
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={kategoriVariant[item.kategori ?? 'umum']}>
                        {kategoriLabel[item.kategori ?? 'umum']}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.tanggal ? formatDate(item.tanggal) : '-'}
                      </span>
                    </div>
                    <CardTitle className="text-base">{item.judul}</CardTitle>
                  </div>
                  <div className="flex gap-1 shrink-0">
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
                      onClick={() => {
                        setDeleteTarget(item)
                        setDeleteDialogOpen(true)
                      }}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Hapus</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.isi}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !isPending && setDialogOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
            </DialogTitle>
            <DialogDescription>Isi detail pengumuman untuk warga RT/RW.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {errors._global && (
              <p className="text-sm text-destructive">{errors._global}</p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pg-judul">Judul</Label>
              <Input
                id="pg-judul"
                placeholder="Judul pengumuman"
                value={form.judul}
                onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
                disabled={isPending}
              />
              {errors.judul && (
                <p className="text-xs text-destructive">{errors.judul}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pg-isi">Isi Pengumuman</Label>
              <Textarea
                id="pg-isi"
                placeholder="Tulis isi pengumuman di sini..."
                rows={4}
                value={form.isi}
                onChange={(e) => setForm((f) => ({ ...f, isi: e.target.value }))}
                disabled={isPending}
              />
              {errors.isi && (
                <p className="text-xs text-destructive">{errors.isi}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pg-tanggal">Tanggal</Label>
                <Input
                  id="pg-tanggal"
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                  disabled={isPending}
                />
                {errors.tanggal && (
                  <p className="text-xs text-destructive">{errors.tanggal}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Kategori</Label>
                <div className="flex gap-1 flex-wrap">
                  {(['umum', 'penting', 'acara'] as const).map((k) => (
                    <Button
                      key={k}
                      type="button"
                      size="sm"
                      variant={form.kategori === k ? 'default' : 'outline'}
                      onClick={() => setForm((f) => ({ ...f, kategori: k }))}
                      className="flex-1 text-xs"
                      disabled={isPending}
                    >
                      {kategoriLabel[k]}
                    </Button>
                  ))}
                </div>
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
                'Simpan'
              ) : (
                'Publikasikan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(o) => !isPending && setDeleteDialogOpen(o)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pengumuman</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus{' '}
              <span className="font-semibold">
                &ldquo;{deleteTarget?.judul}&rdquo;
              </span>
              ?
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

// ── Polling ───────────────────────────────────────────────────────────────────

function PollingPanel({ initialPolls }: { initialPolls: PollWithOptions[] }) {
  const [polls, setPolls] = useState<PollWithOptions[]>(initialPolls)
  // Track which polls the user has voted on in this session: pollId -> optionId
  const [votedMap, setVotedMap] = useState<Record<number, number>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PollWithOptions | null>(null)
  const [form, setForm] = useState({
    pertanyaan: '',
    opsi: ['', ''],
    tanggal: new Date().toISOString().split('T')[0],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const [votingPollId, setVotingPollId] = useState<number | null>(null)

  async function refreshData() {
    const fresh = await getPollsWithOptions()
    setPolls(fresh)
  }

  function openAdd() {
    setForm({
      pertanyaan: '',
      opsi: ['', ''],
      tanggal: new Date().toISOString().split('T')[0],
    })
    setErrors({})
    setDialogOpen(true)
  }

  function addOpsi() {
    if (form.opsi.length >= 6) return
    setForm((f) => ({ ...f, opsi: [...f.opsi, ''] }))
  }

  function removeOpsi(idx: number) {
    if (form.opsi.length <= 2) return
    setForm((f) => ({ ...f, opsi: f.opsi.filter((_, i) => i !== idx) }))
  }

  function updateOpsi(idx: number, val: string) {
    setForm((f) => ({
      ...f,
      opsi: f.opsi.map((o, i) => (i === idx ? val : o)),
    }))
  }

  function validatePoll() {
    const e: Record<string, string> = {}
    if (!form.pertanyaan.trim()) e.pertanyaan = 'Pertanyaan tidak boleh kosong.'
    const filledOpsi = form.opsi.filter((o) => o.trim())
    if (filledOpsi.length < 2) e.opsi = 'Minimal 2 opsi harus diisi.'
    if (!form.tanggal) e.tanggal = 'Tanggal wajib diisi.'
    return e
  }

  function handleCreatePoll() {
    const e = validatePoll()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    startTransition(async () => {
      try {
        await createPoll({
          pertanyaan: form.pertanyaan.trim(),
          tanggal: form.tanggal,
          opsi: form.opsi.filter((o) => o.trim()).map((o) => o.trim()),
        })
        await refreshData()
        setDialogOpen(false)
      } catch {
        setErrors({ _global: 'Terjadi kesalahan. Coba lagi.' })
      }
    })
  }

  function handleVote(pollId: number, optionId: number) {
    if (votedMap[pollId] !== undefined) return
    setVotingPollId(pollId)
    startTransition(async () => {
      try {
        await castVote(optionId)
        setVotedMap((prev) => ({ ...prev, [pollId]: optionId }))
        await refreshData()
      } catch {
        // silently fail — user can retry
      } finally {
        setVotingPollId(null)
      }
    })
  }

  function handleDeletePoll() {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deletePoll(deleteTarget.id)
        await refreshData()
        setDeleteDialogOpen(false)
        setDeleteTarget(null)
      } catch {
        setErrors({ _global: 'Gagal menghapus. Coba lagi.' })
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{polls.length} polling aktif</p>
        <Button size="sm" onClick={openAdd} className="gap-2" disabled={isPending}>
          <Plus className="h-4 w-4" />
          Buat Polling
        </Button>
      </div>

      {polls.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <BarChart2 className="h-10 w-10 opacity-30" />
          <p className="text-sm">Belum ada polling.</p>
          <Button variant="outline" size="sm" onClick={openAdd}>
            Buat Polling Pertama
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {polls.map((poll) => {
            const totalSuara = poll.opsi.reduce((s, o) => s + o.suara, 0)
            const sudahVote = votedMap[poll.id] !== undefined
            const votedOpsiId = votedMap[poll.id]
            const isThisPollVoting = votingPollId === poll.id

            return (
              <Card key={poll.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardDescription>
                        {poll.tanggal ? formatDate(poll.tanggal) : '-'}
                      </CardDescription>
                      <CardTitle className="text-base mt-1">
                        {poll.pertanyaan}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteTarget(poll)
                        setDeleteDialogOpen(true)
                      }}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Hapus</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {poll.opsi.map((opsi) => {
                    const pct =
                      totalSuara > 0 ? Math.round((opsi.suara / totalSuara) * 100) : 0
                    const isVoted = votedOpsiId === opsi.id

                    return (
                      <div key={opsi.id} className="flex flex-col gap-1">
                        {sudahVote ? (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1.5">
                                {isVoted && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                )}
                                <span
                                  className={
                                    isVoted ? 'font-medium text-foreground' : 'text-foreground'
                                  }
                                >
                                  {opsi.teks}
                                </span>
                              </div>
                              <span className="text-muted-foreground text-xs whitespace-nowrap">
                                {opsi.suara} suara ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isVoted ? 'bg-primary' : 'bg-muted-foreground/40'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-sm"
                            onClick={() => handleVote(poll.id, opsi.id)}
                            disabled={isThisPollVoting || isPending}
                          >
                            {isThisPollVoting ? (
                              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            ) : null}
                            {opsi.teks}
                          </Button>
                        )}
                      </div>
                    )
                  })}

                  <div className="pt-1">
                    {sudahVote ? (
                      <p className="text-xs text-muted-foreground">
                        Total {totalSuara} suara &bull; Terima kasih telah memilih
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {totalSuara} suara &bull; Pilih salah satu opsi di atas
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Poll Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !isPending && setDialogOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Polling Baru</DialogTitle>
            <DialogDescription>
              Ajukan pertanyaan dan sediakan opsi pilihan untuk warga.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {errors._global && (
              <p className="text-sm text-destructive">{errors._global}</p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="poll-pertanyaan">Pertanyaan</Label>
              <Textarea
                id="poll-pertanyaan"
                placeholder="Tulis pertanyaan polling..."
                rows={2}
                value={form.pertanyaan}
                onChange={(e) => setForm((f) => ({ ...f, pertanyaan: e.target.value }))}
                disabled={isPending}
              />
              {errors.pertanyaan && (
                <p className="text-xs text-destructive">{errors.pertanyaan}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="poll-tanggal">Tanggal</Label>
              <Input
                id="poll-tanggal"
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                disabled={isPending}
              />
              {errors.tanggal && (
                <p className="text-xs text-destructive">{errors.tanggal}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Opsi Pilihan</Label>
              {form.opsi.map((opsi, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder={`Opsi ${idx + 1}`}
                    value={opsi}
                    onChange={(e) => updateOpsi(idx, e.target.value)}
                    disabled={isPending}
                  />
                  {form.opsi.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 shrink-0 text-muted-foreground"
                      onClick={() => removeOpsi(idx)}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {errors.opsi && (
                <p className="text-xs text-destructive">{errors.opsi}</p>
              )}
              {form.opsi.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOpsi}
                  className="gap-1 self-start"
                  disabled={isPending}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Opsi
                </Button>
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
            <Button onClick={handleCreatePoll} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Membuat...
                </>
              ) : (
                'Buat Polling'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Poll Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(o) => !isPending && setDeleteDialogOpen(o)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Polling</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus polling ini? Semua suara akan ikut
              terhapus.
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
            <Button variant="destructive" onClick={handleDeletePoll} disabled={isPending}>
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
