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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Megaphone,
  BarChart2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  Search,
  Send,
  ClipboardCheck,
  Printer,
} from 'lucide-react'
import {
  getPengumumanList,
  getPollsWithOptions,
  castVote,
  type PollWithOptions,
} from '@/app/actions/informasi'
import {
  requestSuratPengantar,
  searchSuratPengantar,
  getCetakToken,
} from '@/app/actions/surat-pengantar'
import type { Pengumuman, SuratPengantar } from '@/lib/db/schema'

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  initialPengumuman: Pengumuman[]
  initialPolls: PollWithOptions[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Root ──────────────────────────────────────────────────────────────────────

export function PortalClient({ initialPengumuman, initialPolls }: Props) {
  return (
    <Tabs defaultValue="pengumuman" className="flex flex-col gap-4">
      <TabsList className="w-full">
        <TabsTrigger value="pengumuman" className="flex-1 gap-2">
          <Megaphone className="h-4 w-4" />
          Pengumuman
        </TabsTrigger>
        <TabsTrigger value="polling" className="flex-1 gap-2">
          <BarChart2 className="h-4 w-4" />
          Polling
        </TabsTrigger>
        <TabsTrigger value="surat" className="flex-1 gap-2">
          <FileText className="h-4 w-4" />
          Surat
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pengumuman">
        <PengumumanPanel initialItems={initialPengumuman} />
      </TabsContent>

      <TabsContent value="polling">
        <PollingPanel initialPolls={initialPolls} />
      </TabsContent>

      <TabsContent value="surat">
        <SuratPengantarPanel />
      </TabsContent>
    </Tabs>
  )
}

// ── Pengumuman Panel ──────────────────────────────────────────────────────────

function PengumumanPanel({ initialItems }: { initialItems: Pengumuman[] }) {
  const [items, setItems] = useState<Pengumuman[]>(initialItems)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRefresh() {
    setError(null)
    startTransition(async () => {
      try {
        const fresh = await getPengumumanList()
        setItems(fresh)
      } catch {
        setError('Gagal memuat pengumuman. Coba lagi.')
      }
    })
  }

  return (
    <section aria-label="Daftar Pengumuman" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isPending ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Memuat...
            </span>
          ) : (
            `${items.length} pengumuman`
          )}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="text-xs h-7 px-2"
        >
          Muat Ulang
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {isPending && items.length === 0 ? (
        <LoadingSkeleton count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-10 w-10 opacity-30" />}
          message="Belum ada pengumuman saat ini."
          sub="Pantau terus halaman ini untuk informasi terbaru dari RT/RW."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={kategoriVariant[item.kategori ?? 'umum']}>
                      {kategoriLabel[item.kategori ?? 'umum']}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.tanggal ? formatDate(item.tanggal) : '-'}
                    </span>
                  </div>
                  <CardTitle className="text-base leading-snug mt-1">
                    {item.judul}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {item.isi}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ── Polling Panel ─────────────────────────────────────────────────────────────

function PollingPanel({ initialPolls }: { initialPolls: PollWithOptions[] }) {
  const [polls, setPolls] = useState<PollWithOptions[]>(initialPolls)
  // pollId -> chosen optionId (session only — not persisted to DB per user)
  const [votedMap, setVotedMap] = useState<Record<number, number>>({})
  // pollId -> chosen optionId before submitting
  const [selectedMap, setSelectedMap] = useState<Record<number, number>>({})
  // pollId -> validation error
  const [voteErrors, setVoteErrors] = useState<Record<number, string>>({})
  // pollId -> 'voting' | 'done' | 'error'
  const [voteStatus, setVoteStatus] = useState<Record<number, string>>({})
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function refreshPolls() {
    const fresh = await getPollsWithOptions()
    setPolls(fresh)
  }

  function handleRefresh() {
    setError(null)
    startTransition(async () => {
      try {
        await refreshPolls()
      } catch {
        setError('Gagal memuat polling. Coba lagi.')
      }
    })
  }

  function handleSelect(pollId: number, optionId: number) {
    if (votedMap[pollId] !== undefined) return
    setSelectedMap((prev) => ({ ...prev, [pollId]: optionId }))
    // Clear validation error when user selects an option
    setVoteErrors((prev) => {
      const next = { ...prev }
      delete next[pollId]
      return next
    })
  }

  function handleVote(pollId: number) {
    const optionId = selectedMap[pollId]

    // Validation: must have selected an option
    if (optionId === undefined) {
      setVoteErrors((prev) => ({
        ...prev,
        [pollId]: 'Pilih salah satu opsi sebelum mengirim suara.',
      }))
      return
    }

    if (votedMap[pollId] !== undefined) return

    setVoteStatus((prev) => ({ ...prev, [pollId]: 'voting' }))
    startTransition(async () => {
      try {
        await castVote(optionId)
        setVotedMap((prev) => ({ ...prev, [pollId]: optionId }))
        setVoteStatus((prev) => ({ ...prev, [pollId]: 'done' }))
        await refreshPolls()
      } catch {
        setVoteStatus((prev) => ({ ...prev, [pollId]: 'error' }))
      }
    })
  }

  return (
    <section aria-label="Daftar Polling" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isPending ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Memuat...
            </span>
          ) : (
            `${polls.length} polling aktif`
          )}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="text-xs h-7 px-2"
        >
          Muat Ulang
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {isPending && polls.length === 0 ? (
        <LoadingSkeleton count={2} tall />
      ) : polls.length === 0 ? (
        <EmptyState
          icon={<BarChart2 className="h-10 w-10 opacity-30" />}
          message="Belum ada polling aktif saat ini."
          sub="Polling baru akan muncul di sini ketika tersedia."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {polls.map((poll) => {
            const totalSuara = poll.opsi.reduce((s, o) => s + o.suara, 0)
            const sudahVote = votedMap[poll.id] !== undefined
            const votedOpsiId = votedMap[poll.id]
            const selectedOpsiId = selectedMap[poll.id]
            const status = voteStatus[poll.id]
            const isVoting = status === 'voting'
            const hasVoteError = status === 'error'
            const validationError = voteErrors[poll.id]

            return (
              <li key={poll.id}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>
                      {poll.tanggal ? formatDate(poll.tanggal) : '-'}
                    </CardDescription>
                    <CardTitle className="text-base leading-snug">
                      {poll.pertanyaan}
                    </CardTitle>
                    {sudahVote && (
                      <div className="flex items-center gap-1.5 text-xs text-primary font-medium mt-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Suara Anda telah tercatat. Terima kasih!
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="flex flex-col gap-3">
                    {/* Options */}
                    <ul className="flex flex-col gap-2" role="radiogroup" aria-label={poll.pertanyaan}>
                      {poll.opsi.map((opsi) => {
                        const pct =
                          totalSuara > 0
                            ? Math.round((opsi.suara / totalSuara) * 100)
                            : 0
                        const isThisVoted = votedOpsiId === opsi.id
                        const isThisSelected = selectedOpsiId === opsi.id

                        return (
                          <li key={opsi.id}>
                            {sudahVote ? (
                              // ── Result view ───────────────────────────────
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-1.5">
                                    {isThisVoted && (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                    )}
                                    <span
                                      className={
                                        isThisVoted
                                          ? 'font-medium text-foreground'
                                          : 'text-foreground'
                                      }
                                    >
                                      {opsi.teks}
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                                    {opsi.suara} suara ({pct}%)
                                  </span>
                                </div>
                                <div
                                  className="h-2 w-full rounded-full bg-muted overflow-hidden"
                                  role="progressbar"
                                  aria-valuenow={pct}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-label={`${opsi.teks}: ${pct}%`}
                                >
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isThisVoted ? 'bg-primary' : 'bg-muted-foreground/40'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              // ── Vote selection view ───────────────────────
                              <button
                                type="button"
                                role="radio"
                                aria-checked={isThisSelected}
                                onClick={() => handleSelect(poll.id, opsi.id)}
                                disabled={isVoting}
                                className={`w-full rounded-md border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60 ${
                                  isThisSelected
                                    ? 'border-primary bg-primary/8 text-foreground font-medium'
                                    : 'border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                      isThisSelected
                                        ? 'border-primary bg-primary'
                                        : 'border-muted-foreground/40'
                                    }`}
                                    aria-hidden="true"
                                  >
                                    {isThisSelected && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                                    )}
                                  </span>
                                  {opsi.teks}
                                </span>
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>

                    {/* Validation error */}
                    {validationError && !sudahVote && (
                      <p className="flex items-center gap-1.5 text-xs text-destructive">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {validationError}
                      </p>
                    )}

                    {/* Vote error */}
                    {hasVoteError && !sudahVote && (
                      <p className="flex items-center gap-1.5 text-xs text-destructive">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        Gagal mengirim suara. Silakan coba lagi.
                      </p>
                    )}

                    {/* Submit button */}
                    {!sudahVote && (
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="text-xs text-muted-foreground">
                          {totalSuara} suara masuk
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleVote(poll.id)}
                          disabled={isVoting || isPending}
                          className="gap-1.5"
                        >
                          {isVoting ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Mengirim...
                            </>
                          ) : (
                            'Kirim Suara'
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Post-vote total */}
                    {sudahVote && (
                      <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                        Total {totalSuara} suara masuk
                      </p>
                    )}
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// ── Surat Pengantar Panel ─────────────────────────────────────────────────────

const emptyRequestForm = {
  penerima: '',
  nik: '',
  phone: '',
  nomorRumah: '',
  tujuan: '',
  perihal: '',
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  menunggu: 'secondary',
  selesai: 'default',
  ditolak: 'destructive',
}

const statusLabel: Record<string, string> = {
  menunggu: 'Menunggu',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}

function SuratPengantarPanel() {
  // ── Request form state ──────────────────────────────────────────────────────
  const [form, setForm] = useState(emptyRequestForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')
  const [submittedNomor, setSubmittedNomor] = useState<string | null>(null)

  // ── Search state ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SuratPengantar[] | null>(null)
  const [isSearching, startSearchTransition] = useTransition()
  const [searchError, setSearchError] = useState<string | null>(null)

  const [isSubmitting, startSubmitTransition] = useTransition()

  // ── Form helpers ────────────────────────────────────────────────────────────
  function field(key: keyof typeof emptyRequestForm) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    }
  }

  function validateForm() {
    const e: Record<string, string> = {}
    if (!form.penerima.trim()) e.penerima = 'Nama wajib diisi.'
    if (!form.tujuan.trim()) e.tujuan = 'Tujuan surat wajib diisi.'
    if (!form.perihal.trim()) e.perihal = 'Perihal wajib diisi.'
    if (!form.nik.trim() && !form.phone.trim() && !form.nomorRumah.trim()) {
      e.identity =
        'Isi setidaknya satu dari: NIK, nomor HP, atau nomor rumah agar surat dapat ditemukan nanti.'
    }
    return e
  }

  function handleSubmit() {
    const e = validateForm()
    if (Object.keys(e).length > 0) {
      setFormErrors(e)
      return
    }
    setFormErrors({})
    setSubmitStatus('submitting')
    startSubmitTransition(async () => {
      try {
        const result = await requestSuratPengantar(form)
        setSubmittedNomor(result.nomorSurat)
        setSubmitStatus('success')
        setForm(emptyRequestForm)
      } catch {
        setSubmitStatus('error')
      }
    })
  }

  function handleNewRequest() {
    setSubmitStatus('idle')
    setSubmittedNomor(null)
    setFormErrors({})
  }

  // ── Search helpers ──────────────────────────────────────────────────────────
  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    setSearchError(null)
    startSearchTransition(async () => {
      try {
        const results = await searchSuratPengantar(searchQuery)
        setSearchResults(results)
      } catch {
        setSearchError('Gagal melakukan pencarian. Coba lagi.')
      }
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section aria-label="Surat Pengantar" className="flex flex-col gap-4">

      {/* ── Request Form Card ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Ajukan Surat Pengantar</CardTitle>
          </div>
          <CardDescription>
            Isi data di bawah ini untuk mengajukan surat pengantar ke RT/RW.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {submitStatus === 'success' ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-foreground">Permohonan Diterima!</p>
                <p className="text-sm text-muted-foreground">
                  Nomor surat Anda:
                </p>
                <p className="font-mono text-sm font-semibold text-primary">
                  {submittedNomor}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Simpan nomor ini atau catat NIK/HP Anda untuk melacak status surat.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleNewRequest}>
                Ajukan Surat Baru
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {submitStatus === 'error' && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Terjadi kesalahan. Silakan coba lagi.
                </div>
              )}

              {/* Identity error */}
              {formErrors.identity && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formErrors.identity}
                </div>
              )}

              {/* Nama */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sp-penerima">Nama Lengkap</Label>
                <Input
                  id="sp-penerima"
                  placeholder="Nama sesuai KTP"
                  disabled={isSubmitting}
                  {...field('penerima')}
                />
                {formErrors.penerima && (
                  <p className="text-xs text-destructive">{formErrors.penerima}</p>
                )}
              </div>

              {/* Identity row */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sp-nik">NIK</Label>
                  <Input
                    id="sp-nik"
                    placeholder="16 digit NIK"
                    inputMode="numeric"
                    maxLength={16}
                    disabled={isSubmitting}
                    {...field('nik')}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sp-phone">Nomor HP</Label>
                  <Input
                    id="sp-phone"
                    placeholder="cth. 08123456789"
                    inputMode="tel"
                    disabled={isSubmitting}
                    {...field('phone')}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sp-rumah">Nomor Rumah</Label>
                  <Input
                    id="sp-rumah"
                    placeholder="cth. 12A"
                    disabled={isSubmitting}
                    {...field('nomorRumah')}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                Isi minimal satu kolom di atas agar surat dapat ditemukan saat pencarian.
              </p>

              {/* Tujuan */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sp-tujuan">Tujuan Surat</Label>
                <Input
                  id="sp-tujuan"
                  placeholder="cth. Kelurahan Sukamaju"
                  disabled={isSubmitting}
                  {...field('tujuan')}
                />
                {formErrors.tujuan && (
                  <p className="text-xs text-destructive">{formErrors.tujuan}</p>
                )}
              </div>

              {/* Perihal */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sp-perihal">Perihal / Keperluan</Label>
                <Textarea
                  id="sp-perihal"
                  placeholder="cth. Keterangan Domisili untuk pembuatan rekening bank"
                  rows={2}
                  disabled={isSubmitting}
                  {...field('perihal')}
                />
                {formErrors.perihal && (
                  <p className="text-xs text-destructive">{formErrors.perihal}</p>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Kirim Permohonan
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Search Card ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Cari Status Surat</CardTitle>
          </div>
          <CardDescription>
            Cari surat Anda menggunakan NIK, nomor HP, atau nomor rumah.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Masukkan NIK / No. HP / No. Rumah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching}
              className="flex-1"
              aria-label="Kata kunci pencarian surat"
            />
            <Button type="submit" disabled={isSearching} size="sm" className="gap-1.5 shrink-0">
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="sr-only sm:not-sr-only">Cari</span>
            </Button>
          </form>

          {searchError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {searchError}
            </div>
          )}

          {isSearching && (
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          )}

          {!isSearching && searchResults !== null && (
            searchResults.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
                <FileText className="h-8 w-8 text-muted-foreground opacity-40" />
                <p className="text-sm font-medium text-foreground">Tidak ditemukan</p>
                <p className="text-xs text-muted-foreground">
                  Tidak ada surat yang cocok dengan kata kunci tersebut.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground mb-1">
                  {searchResults.length} surat ditemukan
                </p>
                <ul className="flex flex-col gap-2">
                  {searchResults.map((surat) => (
                    <SuratResultItem key={surat.id} surat={surat} />
                  ))}
                </ul>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </section>
  )
}

// ── Surat result item (isolated so it can hold its own loading state) ─────────

function SuratResultItem({ surat }: { surat: SuratPengantar }) {
  const isSelesai = surat.status === 'selesai'
  const [loadingCetak, setLoadingCetak] = useState(false)

  async function handleCetak() {
    setLoadingCetak(true)
    try {
      const token = await getCetakToken(surat.id)
      window.open(`/portal/cetak/${token}`, '_blank', 'noopener,noreferrer')
    } finally {
      setLoadingCetak(false)
    }
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-mono text-xs text-muted-foreground">
          {surat.nomorSurat}
        </span>
        <Badge variant={statusVariant[surat.status ?? 'menunggu']}>
          {statusLabel[surat.status ?? 'menunggu']}
        </Badge>
      </div>
      <p className="text-sm font-medium text-foreground leading-snug">
        {surat.penerima}
      </p>
      <p className="text-xs text-muted-foreground">{surat.perihal}</p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {surat.tanggal ? formatDate(surat.tanggal) : '-'}
          {surat.tujuan ? ` · ${surat.tujuan}` : ''}
        </p>
        {isSelesai && (
          <button
            type="button"
            onClick={handleCetak}
            disabled={loadingCetak}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            aria-label={`Cetak surat ${surat.nomorSurat}`}
          >
            {loadingCetak ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Printer className="h-3.5 w-3.5" />
            )}
            Cetak Surat
          </button>
        )}
      </div>
    </li>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function LoadingSkeleton({ count, tall }: { count: number; tall?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2 gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-3/4" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Skeleton className={tall ? 'h-24 w-full' : 'h-14 w-full'} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyState({
  icon,
  message,
  sub,
}: {
  icon: React.ReactNode
  message: string
  sub: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">{sub}</p>
      </div>
    </div>
  )
}
