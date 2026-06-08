'use server'

import { db } from '@/lib/db'
import { families, residents, type NewFamily } from '@/lib/db/schema'
import { eq, desc, ilike, or, and, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Get all families with member count
export async function getFamilies(params?: {
  search?: string
  limit?: number
  offset?: number
}) {
  const { search, limit = 10, offset = 0 } = params || {}

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
export async function getFamilyById(id: number) {
  const familyResult = await db
    .select()
    .from(families)
    .where(eq(families.id, id))
    .limit(1)

  if (familyResult.length === 0) return null

  const members = await db
    .select()
    .from(residents)
    .where(eq(residents.familyId, id))
    .orderBy(residents.familyStatus)

  return {
    ...familyResult[0],
    members,
  }
}

// Get all families for dropdown selection
export async function getAllFamilies() {
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
  const result = await db.insert(families).values(data).returning()
  revalidatePath('/keluarga')
  revalidatePath('/')
  return result[0]
}

// Update family
export async function updateFamily(id: number, data: Partial<NewFamily>) {
  const result = await db
    .update(families)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(families.id, id))
    .returning()
  revalidatePath('/keluarga')
  revalidatePath(`/keluarga/${id}`)
  revalidatePath('/')
  return result[0]
}

// Delete family
export async function deleteFamily(id: number) {
  await db.delete(families).where(eq(families.id, id))
  revalidatePath('/keluarga')
  revalidatePath('/')
}

// Get family statistics
export async function getFamilyStats() {
  const totalFamilies = await db.select({ count: count() }).from(families)

  return {
    total: totalFamilies[0].count,
  }
}
