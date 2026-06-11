'use server'

import { db, driver } from '@/lib/db'
import { families, residents, type NewFamily } from '@/lib/db/schema'
import { eq, desc, ilike, or, and, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { sheetsGet, sheetsPost } from '@/lib/db/sheets-driver'

// Get all families with member count
export async function getFamilies(params?: {
  search?: string
  limit?: number
  offset?: number
}) {
  const { search, limit = 10, offset = 0 } = params || {}

  if (driver === 'gas') {
    let allFams = await sheetsGet('getFamilies')
    const allRes = await sheetsGet('getResidents')
    
    if (search) {
      const s = search.toLowerCase()
      allFams = allFams.filter((f: any) => 
        (f.familyCardNumber && f.familyCardNumber.toLowerCase().includes(s)) ||
        (f.address && f.address.toLowerCase().includes(s))
      )
    }

    const total = allFams.length
    allFams.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const paginated = allFams.slice(offset, offset + limit)

    return {
      data: paginated.map((f: any) => {
        const memberCount = allRes.filter((r: any) => r.familyId == f.id).length
        return { ...f, memberCount }
      }),
      total,
    }
  }

  const conditions = []

  if (search) {
    conditions.push(
      or(
        ilike(families.familyCardNumber, `%${search}%`),
        ilike(families.address, `%${search}%`)
      )
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const data = await db
    .select({
      family: families,
      memberCount: count(residents.id),
    })
    .from(families)
    .leftJoin(residents, eq(families.id, residents.familyId))
    .where(whereClause)
    .groupBy(families.id)
    .orderBy(desc(families.createdAt))
    .limit(limit)
    .offset(offset)

  const totalResult = await db
    .select({ count: count() })
    .from(families)
    .where(whereClause)

  return {
    data: data.map((row) => ({
      ...row.family,
      memberCount: row.memberCount,
    })),
    total: totalResult[0].count,
  }
}

// Get single family by ID with members
export async function getFamilyById(id: number | string) {
  if (driver === 'gas') {
    const allFams = await sheetsGet('getFamilies')
    const fam = allFams.find((f: any) => f.id == id)
    if (!fam) return null

    const allRes = await sheetsGet('getResidents')
    const members = allRes.filter((r: any) => r.familyId == id)

    return {
      ...fam,
      members,
    }
  }

  const familyResult = await db
    .select()
    .from(families)
    .where(eq(families.id, Number(id)))
    .limit(1)

  if (familyResult.length === 0) return null

  const members = await db
    .select()
    .from(residents)
    .where(eq(residents.familyId, Number(id)))
    .orderBy(residents.familyStatus)

  return {
    ...familyResult[0],
    members,
  }
}

// Get all families for dropdown selection
export async function getAllFamilies() {
  if (driver === 'gas') {
    const allFams = await sheetsGet('getFamilies')
    return allFams
      .map((f: any) => ({
        id: f.id,
        familyCardNumber: f.familyCardNumber,
        address: f.address,
      }))
      .sort((a: any, b: any) => (a.familyCardNumber || '').localeCompare(b.familyCardNumber || ''))
  }

  return db
    .select({
      id: families.id,
      familyCardNumber: families.familyCardNumber,
      address: families.address,
    })
    .from(families)
    .orderBy(families.familyCardNumber)
}

// Create new family
export async function createFamily(data: NewFamily) {
  let result
  if (driver === 'gas') {
    result = await sheetsPost('createFamily', { data })
  } else {
    const res = await db.insert(families).values(data).returning()
    result = res[0]
  }
  revalidatePath('/keluarga')
  revalidatePath('/')
  return result
}

// Update family
export async function updateFamily(id: number | string, data: Partial<NewFamily>) {
  let result
  if (driver === 'gas') {
    result = await sheetsPost('updateFamily', { data: { id, ...data } })
  } else {
    const res = await db
      .update(families)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(families.id, Number(id)))
      .returning()
    result = res[0]
  }
  revalidatePath('/keluarga')
  revalidatePath(`/keluarga/${id}`)
  revalidatePath('/')
  return result
}

// Delete family
export async function deleteFamily(id: number | string) {
  if (driver === 'gas') {
    await sheetsPost('deleteFamily', { id })
  } else {
    await db.delete(families).where(eq(families.id, Number(id)))
  }
  revalidatePath('/keluarga')
  revalidatePath('/')
}

// Get family statistics
export async function getFamilyStats() {
  if (driver === 'gas') {
    const allFams = await sheetsGet('getFamilies')
    return { total: allFams.length }
  }

  const totalFamilies = await db.select({ count: count() }).from(families)
  return {
    total: totalFamilies[0].count,
  }
}
