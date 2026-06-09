'use server'

import { db } from '@/lib/db'
import {
  pengumuman,
  polls,
  pollOptions,
  type NewPengumuman,
  type NewPoll,
} from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// ── Pengumuman ────────────────────────────────────────────────────────────────

export async function getPengumumanList() {
  return db
    .select()
    .from(pengumuman)
    .orderBy(desc(pengumuman.tanggal), desc(pengumuman.createdAt))
}

export async function createPengumuman(
  data: Omit<NewPengumuman, 'id' | 'createdAt' | 'updatedAt'>
) {
  const result = await db.insert(pengumuman).values(data).returning()
  revalidatePath('/informasi')
  revalidatePath('/portal')
  return result[0]
}

export async function updatePengumuman(
  id: number,
  data: Partial<Omit<NewPengumuman, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const result = await db
    .update(pengumuman)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(pengumuman.id, id))
    .returning()
  revalidatePath('/informasi')
  revalidatePath('/portal')
  return result[0]
}

export async function deletePengumuman(id: number) {
  await db.delete(pengumuman).where(eq(pengumuman.id, id))
  revalidatePath('/informasi')
  revalidatePath('/portal')
}

// ── Polling ───────────────────────────────────────────────────────────────────

export type PollWithOptions = {
  id: number
  pertanyaan: string
  tanggal: string | null
  createdAt: Date | null
  opsi: { id: number; teks: string; suara: number }[]
}

export async function getPollsWithOptions(): Promise<PollWithOptions[]> {
  const pollRows = await db
    .select()
    .from(polls)
    .orderBy(desc(polls.createdAt))

  const optionRows = await db.select().from(pollOptions)

  return pollRows.map((p) => ({
    ...p,
    opsi: optionRows
      .filter((o) => o.pollId === p.id)
      .map((o) => ({ id: o.id, teks: o.teks, suara: o.suara })),
  }))
}

export async function createPoll(data: {
  pertanyaan: string
  tanggal: string
  opsi: string[]
}) {
  const [poll] = await db
    .insert(polls)
    .values({ pertanyaan: data.pertanyaan, tanggal: data.tanggal })
    .returning()

  for (const teks of data.opsi) {
    await db.insert(pollOptions).values({ pollId: poll.id, teks, suara: 0 })
  }

  revalidatePath('/informasi')
  revalidatePath('/portal')
  return poll
}

export async function castVote(optionId: number) {
  const [option] = await db
    .select()
    .from(pollOptions)
    .where(eq(pollOptions.id, optionId))
    .limit(1)

  if (!option) throw new Error('Opsi tidak ditemukan')

  await db
    .update(pollOptions)
    .set({ suara: option.suara + 1 })
    .where(eq(pollOptions.id, optionId))

  revalidatePath('/informasi')
  revalidatePath('/portal')
}

export async function deletePoll(id: number) {
  await db.delete(polls).where(eq(polls.id, id))
  revalidatePath('/informasi')
  revalidatePath('/portal')
}
