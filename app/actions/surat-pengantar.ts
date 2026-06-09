'use server'

import { db } from '@/lib/db'
import { suratPengantar, type NewSuratPengantar } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getSuratPengantarList() {
  return db.select().from(suratPengantar).orderBy(desc(suratPengantar.tanggal), desc(suratPengantar.createdAt))
}

export async function createSuratPengantar(
  data: Omit<NewSuratPengantar, 'id' | 'createdAt' | 'updatedAt'>
) {
  const result = await db.insert(suratPengantar).values(data).returning()
  revalidatePath('/surat-pengantar')
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
