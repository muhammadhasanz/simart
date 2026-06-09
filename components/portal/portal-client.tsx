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
} from 'lucide-react'
import {
  getPengumumanList,
  getPollsWithOptions,
  castVote,
  type PollWithOptions,
} from '@/app/actions/informasi'
import type { Pengumuman } from '@/lib/db/schema'

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
