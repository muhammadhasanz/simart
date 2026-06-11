'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
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
  PieChart,
  Wallet,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

import {
  getPengumumanList,
  getPollsWithOptions,
  castVote,
  type PollWithOptions,
} from '@/app/actions/informasi'
import { requestSuratPengantar, searchSuratPengantar, getCetakToken } from '@/app/actions/surat-pengantar'
import {
  getResidentStats,
  getAgeDistribution,
  getReligionComposition,
  getOccupationBreakdown,
} from '@/app/actions/residents'
import { getFamilyStats } from '@/app/actions/families'
import { getKasIuranList, getKasIuranSummary } from '@/app/actions/kas-iuran'

import type { Pengumuman, SuratPengantar, KasIuran } from '@/lib/db/schema'
import { generateFingerprint, getOrCreateVoterToken } from '@/lib/voter-identity'

import { StatsCards } from '@/components/dashboard/stats-cards'
import { GenderChart } from '@/components/dashboard/charts/gender-chart'
import { AgeChart } from '@/components/dashboard/charts/age-chart'
import { ReligionChart } from '@/components/dashboard/charts/religion-chart'
import { OccupationChart } from '@/components/dashboard/charts/occupation-chart'
import { CardListSkeleton } from '@/components/ui/card-list-skeleton'

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

export function PortalClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'statistik'

  function handleTabChange(value: string) {
    router.push(`?tab=${value}`, { scroll: false })
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="flex flex-col gap-4 pb-24 sm:pb-0">
      <TabsList className="grid grid-cols-5 h-auto gap-1 z-50 sm:relative sm:w-full max-sm:fixed max-sm:bottom-6 max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:w-[calc(100%-2rem)] max-sm:shadow-2xl max-sm:border max-sm:border-border/50 max-sm:bg-muted/90 max-sm:backdrop-blur-lg max-sm:pb-10 max-sm:rounded-lg">
        <TabsTrigger value="statistik" className="gap-2 max-sm:py-2">
          <PieChart className="h-4 w-4 shrink-0" />
          <span className="hidden sm:block truncate">Statistik</span>
        </TabsTrigger>
        <TabsTrigger value="kas" className="gap-2 max-sm:py-2">
          <Wallet className="h-4 w-4 shrink-0" />
          <span className="hidden sm:block truncate">Kas</span>
        </TabsTrigger>
        <TabsTrigger value="pengumuman" className="gap-2 max-sm:py-2">
          <Megaphone className="h-4 w-4 shrink-0" />
          <span className="hidden sm:block truncate">Pengumuman</span>
        </TabsTrigger>
        <TabsTrigger value="polling" className="gap-2 max-sm:py-2">
          <BarChart2 className="h-4 w-4 shrink-0" />
          <span className="hidden sm:block truncate">Polling</span>
        </TabsTrigger>
        <TabsTrigger value="surat" className="gap-2 max-sm:py-2">
          <FileText className="h-4 w-4 shrink-0" />
          <span className="hidden sm:block truncate">Surat</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pengumuman" keepMounted>
        <PengumumanPanel />
      </TabsContent>

      <TabsContent value="polling" keepMounted>
        <PollingPanel />
      </TabsContent>

      <TabsContent value="surat" keepMounted>
        <SuratPengantarPanel />
      </TabsContent>

      <TabsContent value="statistik" keepMounted>
        <StatistikPanel />
      </TabsContent>

      <TabsContent value="kas" keepMounted>
        <KasIuranPanel />
      </TabsContent>
    </Tabs>
  )
}

// ── Pengumuman Panel ──────────────────────────────────────────────────────────

function PengumumanPanel() {
  const [items, setItems] = useState<Pengumuman[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getPengumumanList()
      .then(res => { if (mounted) { setItems(res); setIsLoading(false) } })
      .catch(() => { if (mounted) { setError('Gagal memuat pengumuman'); setIsLoading(false) } })
    return () => { mounted = false }
  }, [])

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
          {isLoading || isPending ? (
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
          disabled={isLoading || isPending}
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

      {isLoading ? (
        <CardListSkeleton count={3} />
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
                    <span className="text-xs text-muted-foreground" suppressHydrationWarning>
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

function PollingPanel() {
  const [polls, setPolls] = useState<PollWithOptions[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [votedMap, setVotedMap] = useState<Record<number, number>>({})
  const [selectedMap, setSelectedMap] = useState<Record<number, number>>({})
  const [voteErrors, setVoteErrors] = useState<Record<number, string>>({})
  const [voteStatus, setVoteStatus] = useState<Record<number, string>>({})
  const [isRefreshing, startRefresh] = useTransition()
  const [isVotingTransition, startVoting] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmPollId, setConfirmPollId] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    getPollsWithOptions()
      .then(res => { if (mounted) { setPolls(res); setIsLoading(false) } })
      .catch(() => { if (mounted) { setError('Gagal memuat polling'); setIsLoading(false) } })

    try {
      const storedVotedMap = localStorage.getItem('voted_map')
      if (storedVotedMap) {
        setVotedMap(JSON.parse(storedVotedMap))
      }
    } catch (e) { }

    return () => { mounted = false }
  }, [])

  async function refreshPolls() {
    const fresh = await getPollsWithOptions()
    setPolls(fresh)
  }

  function handleRefresh() {
    setError(null)
    startRefresh(async () => {
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
    setVoteErrors((prev) => {
      const next = { ...prev }
      delete next[pollId]
      return next
    })
  }

  function handleVote(pollId: number) {
    const optionId = selectedMap[pollId]
    if (optionId === undefined) {
      setVoteErrors((prev) => ({ ...prev, [pollId]: 'Pilih salah satu opsi sebelum mengirim suara.' }))
      return
    }
    if (votedMap[pollId] !== undefined) return

    setVoteStatus((prev) => ({ ...prev, [pollId]: 'voting' }))
    startVoting(async () => {
      try {
        const ipRes = await fetch('/api/voter-ip')
        const { ip } = await ipRes.json()
        const fingerprint = await generateFingerprint()
        const voterToken = getOrCreateVoterToken()

        await castVote(optionId, { fingerprint, voterToken, ip })

        setPolls((prev) =>
          prev.map(p => p.id == pollId ? {
            ...p,
            opsi: p.opsi.map(o => o.id == optionId ? { ...o, suara: Number(o.suara) + 1 } : o)
          } : p)
        )

        const nextMap = { ...votedMap, [pollId]: optionId }
        setVotedMap(nextMap)
        localStorage.setItem('voted_map', JSON.stringify(nextMap))

        setVoteStatus((prev) => ({ ...prev, [pollId]: 'done' }))
        await refreshPolls()
      } catch (err: any) {
        if (err?.message === 'ALREADY_VOTED' || err?.message?.includes('ALREADY_VOTED')) {
          setVoteErrors((prev) => ({ ...prev, [pollId]: 'Kamu sudah pernah memilih di polling ini.' }))
          const nextMap = { ...votedMap, [pollId]: -1 }
          setVotedMap(nextMap)
          localStorage.setItem('voted_map', JSON.stringify(nextMap))
          setVoteStatus((prev) => ({ ...prev, [pollId]: 'done' }))
        } else {
          setVoteStatus((prev) => ({ ...prev, [pollId]: 'error' }))
        }
      }
    })
  }

  return (
    <section aria-label="Daftar Polling" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading || isRefreshing ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Memuat...
            </span>
          ) : (
            `${polls.length} polling aktif`
          )}
        </p>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading || isRefreshing} className="text-xs h-7 px-2">
          Muat Ulang
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <CardListSkeleton count={2} tall />
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
            const maxSuara = Math.max(...poll.opsi.map((o) => o.suara))
            const hasVotes = totalSuara > 0
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
                    <CardDescription suppressHydrationWarning>
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
                    <ul className="flex flex-col gap-2" role="radiogroup" aria-label={poll.pertanyaan}>
                      {poll.opsi.map((opsi) => {
                        const pct = totalSuara > 0 ? Math.round((opsi.suara / totalSuara) * 100) : 0
                        const isThisVoted = votedOpsiId === opsi.id
                        const isThisSelected = selectedOpsiId === opsi.id
                        const isLeading = hasVotes && opsi.suara === maxSuara

                        return (
                          <li key={opsi.id}>
                            {sudahVote ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-1.5">
                                    {isThisVoted && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                                    <span className={isLeading || isThisVoted ? 'font-bold text-foreground' : 'text-foreground'}>
                                      {opsi.teks}
                                    </span>
                                  </div>
                                  <span className={isLeading ? "font-medium text-foreground text-xs whitespace-nowrap" : "text-muted-foreground text-xs whitespace-nowrap"}>
                                    {opsi.suara} suara ({pct}%)
                                  </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-500 ${isThisVoted ? 'bg-primary' : isLeading ? 'bg-muted-foreground' : 'bg-muted-foreground/40'}`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                role="radio"
                                aria-checked={isThisSelected}
                                onClick={() => handleSelect(poll.id, opsi.id)}
                                disabled={isVoting}
                                className={`w-full rounded-md border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60 ${isThisSelected ? 'border-primary bg-primary/8 text-foreground font-medium' : 'border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground'}`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isThisSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'}`}>
                                    {isThisSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                                  </span>
                                  {opsi.teks}
                                </span>
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                    {validationError && !sudahVote && (
                      <p className="flex items-center gap-1.5 text-xs text-destructive">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {validationError}
                      </p>
                    )}
                    {hasVoteError && !sudahVote && (
                      <p className="flex items-center gap-1.5 text-xs text-destructive">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        Gagal mengirim suara. Silakan coba lagi.
                      </p>
                    )}
                    {!sudahVote && (
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="text-xs text-muted-foreground">{totalSuara} suara masuk</span>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (selectedMap[poll.id] === undefined) {
                              setVoteErrors((prev) => ({ ...prev, [poll.id]: 'Pilih salah satu opsi sebelum mengirim suara.' }))
                              return
                            }
                            setConfirmPollId(poll.id)
                          }}
                          disabled={isVoting || isRefreshing}
                          className="gap-1.5"
                        >
                          {isVoting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Mengirim...</> : 'Kirim Suara'}
                        </Button>
                      </div>
                    )}
                    {sudahVote && (
                      <p className="text-xs text-muted-foreground pt-1 border-t border-border">Total {totalSuara} suara masuk</p>
                    )}
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={confirmPollId !== null} onOpenChange={(open) => !open && setConfirmPollId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pilihan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengirim suara ini? Suara yang telah dikirim tidak dapat diubah kembali.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmPollId(null)} disabled={isVotingTransition}>Batal</Button>
            <Button onClick={() => { if (confirmPollId !== null) { handleVote(confirmPollId); setConfirmPollId(null) } }} disabled={isVotingTransition}>Kirim Suara</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

// ── Surat Pengantar Panel ─────────────────────────────────────────────────────

const emptyRequestForm = { penerima: '', nik: '', phone: '', nomorRumah: '', tujuan: '', perihal: '' }
const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = { menunggu: 'secondary', selesai: 'default', ditolak: 'destructive' }
const statusLabel: Record<string, string> = { menunggu: 'Menunggu', selesai: 'Selesai', ditolak: 'Ditolak' }

function SuratPengantarPanel() {
  const [form, setForm] = useState(emptyRequestForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submittedNomor, setSubmittedNomor] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SuratPengantar[] | null>(null)
  const [isSearching, startSearchTransition] = useTransition()
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSubmitting, startSubmitTransition] = useTransition()

  function field(key: keyof typeof emptyRequestForm) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
    }
  }

  function validateForm() {
    const e: Record<string, string> = {}
    if (!form.penerima.trim()) e.penerima = 'Nama wajib diisi.'
    if (!form.tujuan.trim()) e.tujuan = 'Tujuan surat wajib diisi.'
    if (!form.perihal.trim()) e.perihal = 'Perihal wajib diisi.'
    if (!form.nik.trim() && !form.phone.trim() && !form.nomorRumah.trim()) {
      e.identity = 'Isi setidaknya satu dari: NIK, nomor HP, atau nomor rumah agar surat dapat ditemukan nanti.'
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

  return (
    <section aria-label="Surat Pengantar" className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Ajukan Surat Pengantar</CardTitle>
          </div>
          <CardDescription>Isi data di bawah ini untuk mengajukan surat pengantar ke RT/RW.</CardDescription>
        </CardHeader>
        <CardContent>
          {submitStatus === 'success' ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-foreground">Permohonan Diterima!</p>
                <p className="text-sm text-muted-foreground">Nomor surat Anda:</p>
                <p className="font-mono text-sm font-semibold text-primary">{submittedNomor}</p>
                <p className="text-xs text-muted-foreground mt-1">Simpan nomor ini atau catat NIK/HP Anda untuk melacak status surat.</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleNewRequest}>Ajukan Surat Baru</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {submitStatus === 'error' && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Terjadi kesalahan. Silakan coba lagi.
                </div>
              )}
              {formErrors.identity && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formErrors.identity}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sp-penerima">Nama Lengkap</Label>
                <Input id="sp-penerima" placeholder="Nama sesuai KTP" disabled={isSubmitting} {...field('penerima')} />
                {formErrors.penerima && <p className="text-xs text-destructive">{formErrors.penerima}</p>}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sp-nik">NIK</Label>
                  <Input id="sp-nik" placeholder="16 digit NIK" inputMode="numeric" maxLength={16} disabled={isSubmitting} {...field('nik')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sp-phone">Nomor HP</Label>
                  <Input id="sp-phone" placeholder="cth. 08123456789" inputMode="tel" disabled={isSubmitting} {...field('phone')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sp-rumah">Nomor Rumah</Label>
                  <Input id="sp-rumah" placeholder="cth. 12A" disabled={isSubmitting} {...field('nomorRumah')} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">Isi minimal satu kolom di atas agar surat dapat ditemukan saat pencarian.</p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sp-tujuan">Tujuan Surat</Label>
                <Input id="sp-tujuan" placeholder="cth. Kelurahan Sukamaju" disabled={isSubmitting} {...field('tujuan')} />
                {formErrors.tujuan && <p className="text-xs text-destructive">{formErrors.tujuan}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sp-perihal">Perihal / Keperluan</Label>
                <Textarea id="sp-perihal" placeholder="cth. Keterangan Domisili untuk pembuatan rekening bank" rows={2} disabled={isSubmitting} {...field('perihal')} />
                {formErrors.perihal && <p className="text-xs text-destructive">{formErrors.perihal}</p>}
              </div>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full gap-2">
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Mengirim...</> : <><Send className="h-4 w-4" />Kirim Permohonan</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Cari Status Surat</CardTitle>
          </div>
          <CardDescription>Cari surat Anda menggunakan NIK, nomor HP, atau nomor rumah.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input placeholder="Masukkan NIK / No. HP / No. Rumah..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} disabled={isSearching} className="flex-1" aria-label="Kata kunci pencarian surat" />
            <Button type="submit" disabled={isSearching} size="sm" className="gap-1.5 shrink-0">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
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
              {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          )}
          {!isSearching && searchResults !== null && (
            searchResults.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
                <FileText className="h-8 w-8 text-muted-foreground opacity-40" />
                <p className="text-sm font-medium text-foreground">Tidak ditemukan</p>
                <p className="text-xs text-muted-foreground">Tidak ada surat yang cocok dengan kata kunci tersebut.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground mb-1">{searchResults.length} surat ditemukan</p>
                <ul className="flex flex-col gap-2">
                  {searchResults.map((surat) => <SuratResultItem key={surat.id} surat={surat} />)}
                </ul>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </section>
  )
}

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
        <span className="font-mono text-xs text-muted-foreground">{surat.nomorSurat}</span>
        <Badge variant={statusVariant[surat.status ?? 'menunggu']}>{statusLabel[surat.status ?? 'menunggu']}</Badge>
      </div>
      <p className="text-sm font-medium text-foreground leading-snug">{surat.penerima}</p>
      <p className="text-xs text-muted-foreground">{surat.perihal}</p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
          {surat.tanggal ? formatDate(surat.tanggal) : '-'}
          {surat.tujuan ? ` · ${surat.tujuan}` : ''}
        </p>
        {isSelesai && (
          <button type="button" onClick={handleCetak} disabled={loadingCetak} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" aria-label={`Cetak surat ${surat.nomorSurat}`}>
            {loadingCetak ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
            Cetak Surat
          </button>
        )}
      </div>
    </li>
  )
}

function EmptyState({ icon, message, sub }: { icon: React.ReactNode; message: string; sub: string }) {
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

// ── Statistik Panel ───────────────────────────────────────────────────────────

function StatistikPanel() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      getResidentStats(),
      getFamilyStats(),
      getAgeDistribution(),
      getReligionComposition(),
      getOccupationBreakdown(),
    ]).then(([rs, fs, ad, rc, ob]) => {
      if (mounted) {
        setData({ residentStats: rs, familyStats: fs, ageDistribution: ad, religionComposition: rc, occupationBreakdown: ob })
        setIsLoading(false)
      }
    }).catch(() => {
      if (mounted) setIsLoading(false)
    })
    return () => { mounted = false }
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardContent className="pt-6"><Skeleton className="h-[250px] w-full rounded-full max-w-[250px] mx-auto" /></CardContent></Card>
          <Card><CardContent className="pt-6"><Skeleton className="h-[250px] w-full" /></CardContent></Card>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <section aria-label="Statistik RT" className="flex flex-col gap-6">
      <StatsCards
        totalResidents={data.residentStats.total}
        totalFamilies={data.familyStats.total}
        maleCount={data.residentStats.male}
        femaleCount={data.residentStats.female}
        newThisMonth={data.residentStats.newThisMonth}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <GenderChart male={data.residentStats.male} female={data.residentStats.female} />
        <AgeChart data={data.ageDistribution} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ReligionChart data={data.religionComposition} />
        <OccupationChart data={data.occupationBreakdown} />
      </div>
    </section>
  )
}

// ── Kas Iuran Panel ───────────────────────────────────────────────────────────

function KasIuranPanel() {
  const [data, setData] = useState<{ list: KasIuran[], summary: any } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      getKasIuranList(),
      getKasIuranSummary()
    ]).then(([list, summary]) => {
      if (mounted) {
        setData({ list, summary })
        setIsLoading(false)
      }
    }).catch(() => {
      if (mounted) setIsLoading(false)
    })
    return () => { mounted = false }
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-32" /></CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <section aria-label="Laporan Kas Iuran" className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Kas</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {data.summary.saldo.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Saldo saat ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {data.summary.totalMasuk.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {data.summary.totalKeluar.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Riwayat Transaksi</CardTitle>
          <CardDescription>Catatan aliran dana RT terkini.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.list.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
              <Wallet className="h-8 w-8 opacity-30" />
              <p className="text-sm">Belum ada riwayat transaksi.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border border rounded-lg overflow-hidden">
              {data.list.map((kas) => (
                <div key={kas.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none">{kas.nama}</p>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {kas.tanggal ? formatDate(kas.tanggal) : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Badge variant={kas.jenis === 'masuk' ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                      {kas.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                    </Badge>
                    <span className={`text-sm font-semibold ${kas.jenis === 'masuk' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {kas.jenis === 'masuk' ? '+' : '-'}Rp {Number(kas.nominal).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
