'use server'

import { db } from '@/lib/db'
import { suratPengantar, type NewSuratPengantar } from '@/lib/db/schema'
import { eq, desc, or, like, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { encryptCetakId } from '@/lib/cetak-token'

export async function getSuratPengantarList() {
  return db
    .select()
    .from(suratPengantar)
    .orderBy(desc(suratPengantar.tanggal), desc(suratPengantar.createdAt))
}

export async function createSuratPengantar(
  data: Omit<NewSuratPengantar, 'id' | 'createdAt' | 'updatedAt'>
) {
  const result = await db.insert(suratPengantar).values(data).returning()
  revalidatePath('/surat-pengantar')
  revalidatePath('/portal')
  return result[0]
}

export async function updateSuratPengantar(
  id: number,
  data: Partial<Omit<NewSuratPengantar, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const result = await db
    .update(suratPengantar)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(suratPengantar.id, id))
    .returning()
  revalidatePath('/surat-pengantar')
  return result[0]
}

export async function deleteSuratPengantar(id: number) {
  await db.delete(suratPengantar).where(eq(suratPengantar.id, id))
  revalidatePath('/surat-pengantar')
}

export async function getSuratPengantarById(id: number) {
  const result = await db
    .select()
    .from(suratPengantar)
    .where(eq(suratPengantar.id, id))
    .limit(1)
  return result[0] ?? null
}

/**
 * Returns an AES-256-GCM encrypted, URL-safe token for the given surat ID.
 * Only the server ever sees the raw ID; the client only handles the token.
 */
export async function getCetakToken(id: number): Promise<string> {
  return encryptCetakId(id)
}

/**
 * Submit a surat pengantar request from the public portal.
 * Generates a sequential nomor surat automatically.
 * Works on both SQLite and Postgres because it uses JS-level defaults.
 */
export async function requestSuratPengantar(data: {
  penerima: string
  nik: string
  phone: string
  nomorRumah: string
  tujuan: string
  perihal: string
}) {
  const today = new Date()
  const bulanRomawi = [
    'I','II','III','IV','V','VI',
    'VII','VIII','IX','X','XI','XII',
  ][today.getMonth()]
  const tahun = today.getFullYear()

  // Count existing surat this year to generate an incremental nomor
  const existing = await db
    .select({ id: suratPengantar.id })
    .from(suratPengantar)
    .where(like(suratPengantar.nomorSurat, `%/${tahun}`))

  const urutan = String(existing.length + 1).padStart(3, '0')
  const nomorSurat = `${urutan}/SP-RT/${bulanRomawi}/${tahun}`
  const tanggal = today.toISOString().split('T')[0]

  const result = await db
    .insert(suratPengantar)
    .values({
      nomorSurat,
      penerima: data.penerima.trim(),
      nik: data.nik.trim() || null,
      phone: data.phone.trim() || null,
      nomorRumah: data.nomorRumah.trim() || null,
      tujuan: data.tujuan.trim(),
      perihal: data.perihal.trim(),
      tanggal,
      status: 'menunggu',
    })
    .returning()

  revalidatePath('/surat-pengantar')
  revalidatePath('/portal')
  return result[0]
}

/**
 * Search surat pengantar by NIK, nomor HP, or nomor rumah.
 * An empty query returns an empty array (not all records).
 * Uses `like` with lowercase comparison so it works on both SQLite and Postgres.
 */
export async function searchSuratPengantar(query: string) {
  const q = query.trim()
  if (!q) return []

  const pattern = `%${q}%`

  return db
    .select()
    .from(suratPengantar)
    .where(
      or(
        like(sql`lower(${suratPengantar.nik})`, pattern.toLowerCase()),
        like(sql`lower(${suratPengantar.phone})`, pattern.toLowerCase()),
        like(sql`lower(${suratPengantar.nomorRumah})`, pattern.toLowerCase()),
      )
    )
    .orderBy(desc(suratPengantar.tanggal), desc(suratPengantar.createdAt))
}
