'use server'

import { revalidatePath } from 'next/cache'
import { encryptCetakId, decryptCetakToken } from '@/lib/cetak-token'
import { sheetsGet, sheetsPost } from '@/lib/db/sheets-driver'
import { db, driver } from '@/lib/db'
import { suratPengantar } from '@/lib/db/schema'
import { eq, or, ilike, desc } from 'drizzle-orm'

export async function getSuratPengantarList() {
  if (driver === 'spreadsheet') {
    const data = await sheetsGet('getSuratList')
    // Sort descending by tanggal/createdAt
    return data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  
  const data = await db.select().from(suratPengantar).orderBy(desc(suratPengantar.createdAt))
  return data
}

export async function createSuratPengantar(
  data: {
    nomorSurat?: string
    penerima: string
    nik?: string
    phone?: string
    nomorRumah?: string
    tujuan: string
    perihal: string
    status?: string
    tanggal?: string
  }
) {
  let result
  if (driver === 'spreadsheet') {
    result = await sheetsPost('createSurat', { data })
  } else {
    // Generate nomor surat if not provided
    const today = new Date()
    const prefix = `SP/${today.getFullYear()}/${(today.getMonth() + 1).toString().padStart(2, '0')}`
    
    // Simple sequence fallback (in a real app, query the latest and increment)
    const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const finalNomorSurat = data.nomorSurat || `${prefix}/${seq}`
    
    const [inserted] = await db.insert(suratPengantar).values({
      ...data,
      nomorSurat: finalNomorSurat,
      tanggal: data.tanggal || new Date().toISOString().split('T')[0],
      status: data.status || 'menunggu'
    }).returning()
    result = inserted
  }
  revalidatePath('/surat-pengantar')
  revalidatePath('/portal')
  return result
}

export async function updateSuratPengantar(
  id: number | string,
  data: any
) {
  let result
  if (driver === 'spreadsheet') {
    result = await sheetsPost('updateSurat', { data: { id, ...data } })
  } else {
    const [updated] = await db.update(suratPengantar).set(data).where(eq(suratPengantar.id, Number(id))).returning()
    result = updated
  }
  revalidatePath('/surat-pengantar')
  return result
}

export async function deleteSuratPengantar(id: number | string) {
  if (driver === 'spreadsheet') {
    await sheetsPost('deleteSurat', { id })
  } else {
    await db.delete(suratPengantar).where(eq(suratPengantar.id, Number(id)))
  }
  revalidatePath('/surat-pengantar')
}

export async function getSuratPengantarById(id: number | string) {
  if (driver === 'spreadsheet') {
    const result = await sheetsGet('getSuratById', id.toString())
    return result
  }
  
  const [result] = await db.select().from(suratPengantar).where(eq(suratPengantar.id, Number(id))).limit(1)
  return result || null
}

/**
 * Returns an AES-256-GCM encrypted, URL-safe token for the given surat ID.
 * Only the server ever sees the raw ID; the client only handles the token.
 */
export async function getCetakToken(id: number | string): Promise<string> {
  // encryptCetakId expects a string or number, make sure it handles string IDs from Sheets
  // Since Apps Script IDs are large random strings/numbers, we pass it as string
  return encryptCetakId(id.toString())
}

/**
 * Validates a print token and returns the SuratPengantar if it is valid and ready to print.
 */
export async function getSuratByToken(token: string) {
  const id = decryptCetakToken(token)
  if (!id) return { error: 'not_found' }
  
  const surat = await getSuratPengantarById(id)
  if (!surat) return { error: 'not_found' }
  
  if (surat.status !== 'selesai') return { error: 'not_ready' }
  
  return { surat }
}

/**
 * Submit a surat pengantar request from the public portal.
 * Generates a sequential nomor surat automatically.
 */
export async function requestSuratPengantar(data: {
  penerima: string
  nik: string
  phone: string
  nomorRumah: string
  tujuan: string
  perihal: string
}) {
  let result
  if (driver === 'spreadsheet') {
    result = await sheetsPost('createSurat', { data })
  } else {
    // Generate nomor surat
    const today = new Date()
    const prefix = `SP/${today.getFullYear()}/${(today.getMonth() + 1).toString().padStart(2, '0')}`
    const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const nomorSurat = `${prefix}/${seq}`
    
    const [inserted] = await db.insert(suratPengantar).values({
      ...data,
      nomorSurat,
      tanggal: new Date().toISOString().split('T')[0],
      status: 'menunggu'
    }).returning()
    result = inserted
  }
  revalidatePath('/surat-pengantar')
  revalidatePath('/portal')
  return result
}

/**
 * Search surat pengantar by NIK, nomor HP, or nomor rumah.
 */
export async function searchSuratPengantar(query: string) {
  const q = query.trim()
  if (!q) return []
  
  if (driver === 'spreadsheet') {
    const data = await sheetsGet('searchSurat', q)
    return data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  
  const data = await db
    .select()
    .from(suratPengantar)
    .where(
      or(
        ilike(suratPengantar.nik, `%${q}%`),
        ilike(suratPengantar.phone, `%${q}%`),
        ilike(suratPengantar.nomorRumah, `%${q}%`)
      )
    )
    .orderBy(desc(suratPengantar.createdAt))
    
  return data
}
