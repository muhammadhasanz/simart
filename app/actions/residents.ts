'use server'

import { db } from '@/lib/db'
import { residents, families, type NewResident } from '@/lib/db/schema'
import { eq, desc, sql, and, ilike, or, count } from 'drizzle-orm'
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

  // New residents this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const newThisMonth = await db
    .select({ count: count() })
    .from(residents)
    .where(sql`${residents.createdAt} >= ${startOfMonth}`)

  return {
    total: totalResidents[0].count,
    male: maleCount[0].count,
    female: femaleCount[0].count,
    newThisMonth: newThisMonth[0].count,
  }
}

// Get age distribution for charts
export async function getAgeDistribution() {
  const result = await db.execute(sql`
    SELECT 
      CASE 
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) < 5 THEN '0-4'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) BETWEEN 5 AND 14 THEN '5-14'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) BETWEEN 15 AND 24 THEN '15-24'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) BETWEEN 25 AND 44 THEN '25-44'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) BETWEEN 45 AND 64 THEN '45-64'
        ELSE '65+'
      END as age_group,
      COUNT(*) as count
    FROM residents
    WHERE resident_status = 'active' AND birth_date IS NOT NULL
    GROUP BY age_group
    ORDER BY age_group
  `)

  return result.rows as { age_group: string; count: number }[]
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
