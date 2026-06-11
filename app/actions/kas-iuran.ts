'use server'

import { db, driver } from '@/lib/db'
import { kasIuran, type NewKasIuran } from '@/lib/db/schema'
import { eq, desc, sum, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { sheetsGet, sheetsPost } from '@/lib/db/sheets-driver'

export async function getKasIuranList() {
  if (driver === 'spreadsheet') {
    const data = await sheetsGet('getKasIuran')
    return data
      .map((d: any) => ({ ...d, nominal: Number(d.nominal) }))
      .sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
  }
  return db.select().from(kasIuran).orderBy(desc(kasIuran.tanggal), desc(kasIuran.createdAt))
}

export async function getKasIuranSummary() {
  const rows = driver === 'spreadsheet' 
    ? (await sheetsGet('getKasIuran')).map((d: any) => ({ ...d, nominal: Number(d.nominal) }))
    : await db.select().from(kasIuran)
  let totalMasuk = 0
  let totalKeluar = 0
  for (const row of rows) {
    if (row.jenis === 'masuk') totalMasuk += row.nominal
    else totalKeluar += row.nominal
  }
  return { totalMasuk, totalKeluar, saldo: totalMasuk - totalKeluar }
}

export async function createKasIuran(data: Omit<NewKasIuran, 'id' | 'createdAt' | 'updatedAt'>) {
  let result
  if (driver === 'spreadsheet') {
    result = await sheetsPost('createKasIuran', { data })
  } else {
    const res = await db.insert(kasIuran).values(data).returning()
    result = res[0]
  }
  revalidatePath('/kas-iuran')
  return result
}

export async function updateKasIuran(
  id: number | string,
  data: Partial<Omit<NewKasIuran, 'id' | 'createdAt' | 'updatedAt'>>
) {
  let result
  if (driver === 'spreadsheet') {
    result = await sheetsPost('updateKasIuran', { data: { id, ...data } })
  } else {
    const res = await db
      .update(kasIuran)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(kasIuran.id, Number(id)))
      .returning()
    result = res[0]
  }
  revalidatePath('/kas-iuran')
  return result
}

export async function deleteKasIuran(id: number | string) {
  if (driver === 'spreadsheet') {
    await sheetsPost('deleteKasIuran', { id })
  } else {
    await db.delete(kasIuran).where(eq(kasIuran.id, Number(id)))
  }
  revalidatePath('/kas-iuran')
}
