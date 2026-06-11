'use server'

import { revalidatePath } from 'next/cache'
import { sheetsGet, sheetsPost } from '@/lib/db/sheets-driver'
import { db, driver } from '@/lib/db'
import { pengumuman, polls, pollOptions, pollVotes } from '@/lib/db/schema'
import { eq, or, and, desc } from 'drizzle-orm'

// ── Pengumuman ────────────────────────────────────────────────────────────────

export async function getPengumumanList() {
  if (driver === 'gas') {
    const data = await sheetsGet('getPengumuman')
    return data.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
  }
  
  const data = await db.select().from(pengumuman).orderBy(desc(pengumuman.tanggal))
  return data
}

export async function createPengumuman(
  data: { judul: string; isi: string; tanggal: string; kategori: string }
) {
  let result
  if (driver === 'gas') {
    result = await sheetsPost('createPengumuman', { data })
  } else {
    const inserted = await db.insert(pengumuman).values(data).returning()
    result = inserted[0]
  }
  revalidatePath('/informasi')
  revalidatePath('/portal')
  return result
}

export async function updatePengumuman(
  id: number | string,
  data: { judul?: string; isi?: string; tanggal?: string; kategori?: string }
) {
  let result
  if (driver === 'gas') {
    result = await sheetsPost('updatePengumuman', { data: { id, ...data } })
  } else {
    const updated = await db.update(pengumuman).set(data).where(eq(pengumuman.id, Number(id))).returning()
    result = updated[0]
  }
  revalidatePath('/informasi')
  revalidatePath('/portal')
  return result
}

export async function deletePengumuman(id: number | string) {
  if (driver === 'gas') {
    await sheetsPost('deletePengumuman', { id })
  } else {
    await db.delete(pengumuman).where(eq(pengumuman.id, Number(id)))
  }
  revalidatePath('/informasi')
  revalidatePath('/portal')
}

// ── Polling ───────────────────────────────────────────────────────────────────

export type PollWithOptions = {
  id: number | string
  pertanyaan: string
  tanggal: string | null
  opsi: { id: number | string; poll_id?: string | number; teks: string; suara: number }[]
}

export async function getPollsWithOptions(): Promise<PollWithOptions[]> {
  if (driver === 'gas') {
    const data = await sheetsGet('getPolls')
    return data.sort((a: any, b: any) => {
      if (!a.tanggal) return 1
      if (!b.tanggal) return -1
      return new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    })
  }

  const allPolls = await db.select().from(polls).orderBy(desc(polls.tanggal))
  const allOptions = await db.select().from(pollOptions)

  return allPolls.map((poll: any) => ({
    ...poll,
    opsi: allOptions.filter((opt: any) => opt.pollId === poll.id)
  }))
}

export async function createPoll(data: {
  pertanyaan: string
  tanggal: string
  opsi: string[]
}) {
  let result
  if (driver === 'gas') {
    result = await sheetsPost('createPoll', { data })
  } else {
    const [insertedPoll] = await db.insert(polls).values({
      pertanyaan: data.pertanyaan,
      tanggal: data.tanggal,
    }).returning()

    if (data.opsi && data.opsi.length > 0) {
      await db.insert(pollOptions).values(
        data.opsi.map((teks) => ({
          pollId: insertedPoll.id,
          teks,
          suara: 0,
        }))
      )
    }
    result = insertedPoll
  }
  revalidatePath('/informasi')
  revalidatePath('/portal')
  return result
}

export async function castVote(
  optionId: number,
  identity: { fingerprint: string; voterToken: string; ip: string }
) {
  if (driver === 'gas') {
    // We send optionId AND identity to GAS
    await sheetsPost('castVote', { optionId, identity })
  } else {
    const numOptionId = Number(optionId)
    const [option] = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.id, numOptionId))
      .limit(1)

    if (!option) throw new Error('Opsi tidak ditemukan')

    const pollId = option.pollId

    const [existingVote] = await db
      .select()
      .from(pollVotes)
      .where(
        and(
          eq(pollVotes.pollId, pollId),
          or(
            eq(pollVotes.fingerprint, identity.fingerprint),
            eq(pollVotes.voterToken, identity.voterToken),
            eq(pollVotes.ip, identity.ip)
          )
        )
      )
      .limit(1)

    if (existingVote) {
      throw new Error('ALREADY_VOTED')
    }

    await db.insert(pollVotes).values({
      pollId,
      fingerprint: identity.fingerprint,
      voterToken: identity.voterToken,
      ip: identity.ip,
    })

    await db
      .update(pollOptions)
      .set({ suara: Number(option.suara) + 1 })
      .where(eq(pollOptions.id, numOptionId))
  }

  revalidatePath('/informasi')
  revalidatePath('/portal')
}

export async function deletePoll(id: number | string) {
  if (driver === 'gas') {
    await sheetsPost('deletePoll', { id })
  } else {
    // Assuming cascading delete is set up, or Drizzle handles it
    await db.delete(polls).where(eq(polls.id, Number(id)))
  }
  revalidatePath('/informasi')
  revalidatePath('/portal')
}
