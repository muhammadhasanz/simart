'use server'

import { db } from '@/lib/db'
import { kasIuran, type NewKasIuran } from '@/lib/db/schema'
import { eq, desc, sum, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getKasIuranList() {
  return db.select().from(kasIuran).orderBy(desc(kasIuran.tanggal), desc(kasIuran.createdAt))
}

export async function getKasIuranSummary() {
  const rows = await db.select().from(kasIuran)
  let totalMasuk = 0
  let totalKeluar = 0
  for (const row of rows) {
    if (row.jenis === 'masuk') totalMasuk += row.nominal
    else totalKeluar += row.nominal
  }
  return { totalMasuk, totalKeluar, saldo: totalMasuk - totalKeluar }
}

export async function createKasIuran(data: Omit<NewKasIuran, 'id' | 'createdAt' | 'updatedAt'>) {
  const result = await db.insert(kasIuran).values(data).returning()
  revalidatePath('/kas-iuran')
  return result[0]
}

export async function updateKasIuran(
  id: number,
  data: Partial<Omit<NewKasIuran, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const result = await db
    .update(kasIuran)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(kasIuran.id, id))
    .returning()
  revalidatePath('/kas-iuran')
  return result[0]
}

export async function deleteKasIuran(id: number) {
  await db.delete(kasIuran).where(eq(kasIuran.id, id))
  revalidatePath('/kas-iuran')
}
