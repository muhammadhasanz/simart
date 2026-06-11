'use server'

import { db, driver } from '@/lib/db'
import { residents, families, type NewResident } from '@/lib/db/schema'
import { eq, desc, sql, and, gte, ilike, or, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { sheetsGet, sheetsPost } from '@/lib/db/sheets-driver'

// Get all residents with family info
export async function getResidents(params?: {
  search?: string
  status?: string
  gender?: string
  limit?: number
  offset?: number
}) {
  const { search, status, gender, limit = 10, offset = 0 } = params || {}

  if (driver === 'spreadsheet') {
    let allRes = await sheetsGet('getResidents')
    const allFams = await sheetsGet('getFamilies')

    if (search) {
      const s = search.toLowerCase()
      allRes = allRes.filter((r: any) => 
        (r.fullName && r.fullName.toLowerCase().includes(s)) ||
        (r.nik && r.nik.toLowerCase().includes(s))
      )
    }

    if (status && status !== 'all') {
      allRes = allRes.filter((r: any) => r.residentStatus === status)
    }

    if (gender && gender !== 'all') {
      allRes = allRes.filter((r: any) => r.gender === gender)
    }

    const total = allRes.length
    allRes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const paginated = allRes.slice(offset, offset + limit)

    return {
      data: paginated.map((r: any) => {
        const family = allFams.find((f: any) => f.id == r.familyId) || null
        return { ...r, family }
      }),
      total,
    }
  }

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
export async function getResidentById(id: number | string) {
  if (driver === 'spreadsheet') {
    const allRes = await sheetsGet('getResidents')
    const res = allRes.find((r: any) => r.id == id)
    if (!res) return null

    const allFams = await sheetsGet('getFamilies')
    const family = allFams.find((f: any) => f.id == res.familyId) || null

    return {
      ...res,
      family,
    }
  }

  const result = await db
    .select({
      resident: residents,
      family: families,
    })
    .from(residents)
    .leftJoin(families, eq(residents.familyId, families.id))
    .where(eq(residents.id, Number(id)))
    .limit(1)

  if (result.length === 0) return null

  return {
    ...result[0].resident,
    family: result[0].family,
  }
}

// Create new resident
export async function createResident(data: NewResident) {
  let result
  if (driver === 'spreadsheet') {
    result = await sheetsPost('createResident', { data })
  } else {
    const res = await db.insert(residents).values(data).returning()
    result = res[0]
  }
  revalidatePath('/warga')
  revalidatePath('/')
  return result
}

// Update resident
export async function updateResident(id: number | string, data: Partial<NewResident>) {
  let result
  if (driver === 'spreadsheet') {
    result = await sheetsPost('updateResident', { data: { id, ...data } })
  } else {
    const res = await db
      .update(residents)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(residents.id, Number(id)))
      .returning()
    result = res[0]
  }
  revalidatePath('/warga')
  revalidatePath(`/warga/${id}`)
  revalidatePath('/')
  return result
}

// Delete resident
export async function deleteResident(id: number | string) {
  if (driver === 'spreadsheet') {
    await sheetsPost('deleteResident', { id })
  } else {
    await db.delete(residents).where(eq(residents.id, Number(id)))
  }
  revalidatePath('/warga')
  revalidatePath('/')
}

// Get resident statistics for dashboard
export async function getResidentStats() {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const startOfMonthTime = startOfMonth.getTime()
  const startOfMonthStr = startOfMonth.toISOString()

  if (driver === 'spreadsheet') {
    const allRes = await sheetsGet('getResidents')
    let total = 0, male = 0, female = 0, newThisMonth = 0
    
    for (const r of allRes) {
      if (r.residentStatus === 'active' || r.residentStatus === 'Aktif' || !r.residentStatus) {
        total++
        if (r.gender === 'male' || r.gender === 'Laki-laki') male++
        if (r.gender === 'female' || r.gender === 'Perempuan') female++
      }
      if (r.createdAt && new Date(r.createdAt).getTime() >= startOfMonthTime) {
        newThisMonth++
      }
    }
    
    return { total, male, female, newThisMonth }
  }

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

  const newThisMonth = await db
    .select({ count: count() })
    .from(residents)
    .where(gte(residents.createdAt, startOfMonthStr))

  return {
    total: totalResidents[0].count,
    male: maleCount[0].count,
    female: femaleCount[0].count,
    newThisMonth: newThisMonth[0].count,
  }
}

// Get age distribution for charts
export async function getAgeDistribution() {
  let rows
  if (driver === 'spreadsheet') {
    const allRes = await sheetsGet('getResidents')
    rows = allRes
      .filter((r: any) => (r.residentStatus === 'active' || r.residentStatus === 'Aktif' || !r.residentStatus) && r.birthDate)
      .map((r: any) => ({ birthDate: r.birthDate }))
  } else {
    rows = await db
      .select({ birthDate: residents.birthDate })
      .from(residents)
      .where(
        and(
          eq(residents.residentStatus, 'active'),
          sql`${residents.birthDate} IS NOT NULL`
        )
      )
  }

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
  if (driver === 'spreadsheet') {
    const allRes = await sheetsGet('getResidents')
    const active = allRes.filter((r: any) => r.residentStatus === 'active' || r.residentStatus === 'Aktif' || !r.residentStatus)
    const counts: Record<string, number> = {}
    active.forEach((r: any) => {
      const rel = r.religion || 'Unknown'
      counts[rel] = (counts[rel] || 0) + 1
    })
    return Object.entries(counts).map(([religion, count]) => ({ religion, count }))
  }

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
  if (driver === 'spreadsheet') {
    const allRes = await sheetsGet('getResidents')
    const active = allRes.filter((r: any) => r.residentStatus === 'active' || r.residentStatus === 'Aktif' || !r.residentStatus)
    const counts: Record<string, number> = {}
    active.forEach((r: any) => {
      const occ = r.occupation || 'Lainnya'
      counts[occ] = (counts[occ] || 0) + 1
    })
    return Object.entries(counts)
      .map(([occupation, count]) => ({ occupation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

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
  if (driver === 'spreadsheet') {
    const allRes = await sheetsGet('getResidents')
    return allRes
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }

  const result = await db
    .select()
    .from(residents)
    .orderBy(desc(residents.createdAt))
    .limit(limit)

  return result
}
