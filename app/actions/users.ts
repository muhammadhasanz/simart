'use server'

import { db } from '@/lib/db'
import { user, account } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { hashPassword } from 'better-auth/crypto'

export async function getUsers() {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))

  return rows
}

export async function createUser(data: { name: string; email: string; password: string }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Tidak terautentikasi')

  if (!data.email || !data.password) throw new Error('Email dan password wajib diisi')
  if (data.password.length < 8) throw new Error('Password minimal 8 karakter')

  // Check for duplicate email
  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, data.email.toLowerCase().trim()))
  if (existing.length > 0) throw new Error('Email sudah terdaftar')

  // Hash the password using the same utility Better Auth uses internally
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const hashedPassword = await hashPassword(data.password)

  const newId = crypto.randomUUID()
  // Insert user row — omit createdAt/updatedAt so the DB-level DEFAULT handles
  // them (TEXT DEFAULT datetime('now') on SQLite, $defaultFn on Postgres).
  // Passing Date objects or ISO strings both fail across the pg-core/SQLite boundary.
  await db.insert(user).values({
    id: newId,
    name: data.name.trim() || data.email.split('@')[0],
    email: data.email.toLowerCase().trim(),
    emailVerified: 'true', // admin-created accounts are pre-verified
  })

  // Insert credential account row (required so Better Auth can verify the password on login)
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: newId,
    providerId: 'credential',
    userId: newId,
    password: hashedPassword,
  })

  revalidatePath('/pengguna')
}

export async function deleteUser(userId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Tidak terautentikasi')

  // Prevent self-deletion
  if (session.user.id === userId) {
    throw new Error('Tidak dapat menghapus akun sendiri')
  }

  await db.delete(user).where(eq(user.id, userId))
  revalidatePath('/pengguna')
}
