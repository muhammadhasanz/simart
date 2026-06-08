'use server'

import { db } from '@/lib/db'
import { residents, families, type NewResident } from '@/lib/db/schema'
import { eq, desc, sql, and, gte, ilike, or, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Get all residents with family info
export async function getResidents(params?: {
  search?: string
  status?: string
  gender?: string
  limit?: number
  offset?: number
}) {
  const { search, status, gender, limit = 10, offset = 0 } = params || {}

  const conditions = []

  if (search) {
    conditions.push(
      or(
        ilike(residents.fullName, `%${search}%`),
        ilike(residents.nik, `%${search}%`)
      )
    )
  }

  if (status && status !== 'all') {
    conditions.push(eq(residents.residentStatus, status))
  }

  if (gender && gender !== 'all') {
    conditions.push(eq(residents.gender, gender))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const data = await db
    .select({
      resident: residents,
      family: families,
    })
    .from(residents)
    .leftJoin(families, eq(residents.familyId, families.id))
    .where(whereClause)
    .orderBy(desc(residents.createdAt))
    .limit(limit)
    .offset(offset)

  const totalResult = await db
    .select({ count: count() })
    .from(residents)
    .where(whereClause)

  return {
    data: data.map((row) => ({
      ...row.resident,
      family: row.family,
    })),
    total: totalResult[0].count,
  }
}

// Get single resident by ID
export async function getResidentById(id: number) {
  const result = await db
    .select({
      resident: residents,
      family: families,
    })
    .from(residents)
    .leftJoin(families, eq(residents.familyId, families.id))
    .where(eq(residents.id, id))
    .limit(1)

  if (result.length === 0) return null

  return {
    ...result[0].resident,
    family: result[0].family,
  }
}

// Create new resident
export async function createResident(data: NewResident) {
  const result = await db.insert(residents).values(data).returning()
  revalidatePath('/warga')
  revalidatePath('/')
  return result[0]
}

// Update resident
export async function updateResident(id: number, data: Partial<NewResident>) {
  const result = await db
    .update(residents)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(residents.id, id))
    .returning()
  revalidatePath('/warga')
  revalidatePath(`/warga/${id}`)
  revalidatePath('/')
  return result[0]
}

// Delete resident
export async function deleteResident(id: number) {
  await db.delete(residents).where(eq(residents.id, id))
  revalidatePath('/warga')
  revalidatePath('/')
}

// Get resident statistics for dashboard
export async function getResidentStats() {
  const totalResidents = await db
    .select({ count: count() })
    .from(residents)
    .where(eq(residents.residentStatus, 'active'))

  const maleCount = await db
    .select({ count: count() })
    .from(residents)
    .where(
      and(eq(residents.residentStatus, 'active'), eq(residents.gender, 'male'))
    )

  const femaleCount = await db
    .select({ count: count() })
    .from(residents)
    .where(
      and(
        eq(residents.residentStatus, 'active'),
        eq(residents.gender, 'female')
      )
    )

  // New residents this month.
  // Pass a Date object — Drizzle's PgTimestamp.mapToDriverValue calls
  // .toISOString() on it internally; passing a string causes that call to fail.
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const newThisMonth = await db
    .select({ count: count() })
    .from(residents)
    .where(gte(residents.createdAt, startOfMonth))

  return {
    total: totalResidents[0].count,
    male: maleCount[0].count,
    female: femaleCount[0].count,
    newThisMonth: newThisMonth[0].count,
  }
}

// Get age distribution for charts
export async function getAgeDistribution() {
  // Fetch only the birth_date column for active residents, then bucket in JS.
  // This avoids dialect-specific SQL (EXTRACT/AGE for PG, strftime for SQLite)
  // and is immune to PgBouncer transaction-mode restrictions on complex GROUP BY.
  const rows = await db
    .select({ birthDate: residents.birthDate })
    .from(residents)
    .where(
      and(
        eq(residents.residentStatus, 'active'),
        sql`${residents.birthDate} IS NOT NULL`
      )
    )

  const buckets: Record<string, number> = {
    '0-4': 0,
    '5-14': 0,
    '15-24': 0,
    '25-44': 0,
    '45-64': 0,
    '65+': 0,
  }

  const today = new Date()

  for (const { birthDate } of rows) {
    if (!birthDate) continue
    const dob = new Date(birthDate as string)
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--

    if (age < 5) buckets['0-4']++
    else if (age <= 14) buckets['5-14']++
    else if (age <= 24) buckets['15-24']++
    else if (age <= 44) buckets['25-44']++
    else if (age <= 64) buckets['45-64']++
    else buckets['65+']++
  }

  return Object.entries(buckets).map(([age_group, count]) => ({
    age_group,
    count,
  }))
}

// Get religion composition
export async function getReligionComposition() {
  const result = await db
    .select({
      religion: residents.religion,
      count: count(),
    })
    .from(residents)
    .where(eq(residents.residentStatus, 'active'))
    .groupBy(residents.religion)

  return result.filter((r) => r.religion !== null)
}

// Get occupation breakdown
export async function getOccupationBreakdown() {
  const result = await db
    .select({
      occupation: residents.occupation,
      count: count(),
    })
    .from(residents)
    .where(eq(residents.residentStatus, 'active'))
    .groupBy(residents.occupation)
    .orderBy(desc(count()))
    .limit(10)

  return result.filter((r) => r.occupation !== null)
}

// Get recent residents
export async function getRecentResidents(limit = 5) {
  const result = await db
    .select()
    .from(residents)
    .orderBy(desc(residents.createdAt))
    .limit(limit)

  return result
}
