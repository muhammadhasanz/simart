/**
 * Seed script — membuat satu user admin langsung ke Supabase.
 * Jalankan: node scripts/seed-user.mjs
 */
import postgres from 'postgres'
import { createHash, randomUUID } from 'node:crypto'

// ─── Config ─────────────────────────────────────────────────────────────────
const CONN = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL
if (!CONN) {
  console.error('POSTGRES_URL_NON_POOLING / POSTGRES_URL tidak ditemukan.')
  process.exit(1)
}

const USER_NAME  = 'Administrator'
const USER_EMAIL = 'admin@simart.local'
const USER_PASS  = 'Admin@12345'

// ─── Hash password (same algorithm as better-auth: bcrypt via node:crypto) ──
// better-auth uses bcrypt with 10 rounds. We call the same exported helper.
async function hashPassword(plain) {
  // better-auth/dist/crypto exports hashPassword that uses bcrypt internally.
  // We invoke it the same way to guarantee compatibility.
  const { hashPassword: hash } = await import('better-auth/dist/crypto/index.mjs')
  return hash(plain)
}

// ─── Main ────────────────────────────────────────────────────────────────────
const sql = postgres(CONN, { ssl: 'require', max: 1 })

try {
  // Check existing
  const [existing] = await sql`SELECT id FROM "user" WHERE email = ${USER_EMAIL}`
  if (existing) {
    console.log(`User "${USER_EMAIL}" sudah ada (id: ${existing.id}). Selesai.`)
    await sql.end()
    process.exit(0)
  }

  const hashedPassword = await hashPassword(USER_PASS)
  const userId = randomUUID()
  const now = new Date()

  // Insert user
  await sql`
    INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
    VALUES (${userId}, ${USER_NAME}, ${USER_EMAIL}, true, ${now}, ${now})
  `

  // Insert credential account
  await sql`
    INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${userId}, 'credential', ${userId}, ${hashedPassword}, ${now}, ${now})
  `

  console.log('User berhasil dibuat!')
  console.log('─────────────────────────────────')
  console.log(`Email    : ${USER_EMAIL}`)
  console.log(`Password : ${USER_PASS}`)
  console.log('─────────────────────────────────')
} catch (err) {
  console.error('Gagal membuat user:', err.message)
  process.exit(1)
} finally {
  await sql.end()
}
