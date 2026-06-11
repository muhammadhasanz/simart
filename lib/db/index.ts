/**
 * Database driver factory
 *
 * Priority:
 *  1. Supabase / any Postgres connection  →  drizzle-orm/node-postgres
 *  2. Fallback (development only)         →  drizzle-orm/better-sqlite3  (local file)
 *
 * SQLite is only used when ALL of the following are true:
 *  - No Postgres URL is configured
 *  - NODE_ENV is 'development'
 *  - The better-sqlite3 native bindings can actually be loaded
 *
 * In any other case (production, preview, or environments where the native
 * bindings cannot be compiled), the Postgres driver is used.  If no
 * Postgres URL is set in those environments a clear error is thrown at
 * query-time rather than at module-load time.
 *
 * Consumers always import { db } from '@/lib/db' and get a Drizzle instance
 * regardless of the active driver (unless using 'gas'). The exported `driver` string
 * lets other modules know which path is active without re-checking env vars.
 */

import * as schema from './schema'

// IMPORTANT: Prefer POSTGRES_URL_NON_POOLING (direct connection, port 5432)
// over the pooled PgBouncer URL (port 6543).  PgBouncer runs in transaction
// mode on Supabase, which is incompatible with node-postgres's pool — it
// breaks prepared statements, advisory locks, and even simple queries like
// `select count(*) from "families"` when the pool tries to reuse sessions.
const postgresUrl =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL

// Only attempt SQLite in development AND when native bindings are available.
// We check for the compiled .node binding file on disk rather than doing a
// probe require(), because the Turbopack SSR runtime may fail to load native
// addons even when Node.js itself can load them directly.
const isDev = process.env.NODE_ENV === 'development'

function sqliteBindingExists(): boolean {
  if (!isDev) return false
  try {
    const fs = require('fs') as typeof import('fs')
    const path = require('path') as typeof import('path')
    const bindingDir = path.join(
      process.cwd(),
      'node_modules/.pnpm/better-sqlite3@12.10.0/node_modules/better-sqlite3/build/Release'
    )
    return fs.existsSync(path.join(bindingDir, 'better_sqlite3.node'))
  } catch (error) {
    return false
  }
}

export const driver: 'postgres' | 'sqlite' | 'gas' =
  process.env.DB_DRIVER === 'gas' ? 'gas' :
  process.env.DB_DRIVER === 'sqlite' ? 'sqlite' :
  process.env.DB_DRIVER === 'postgres' ? 'postgres' :
  postgresUrl ? 'postgres' : sqliteBindingExists() ? 'sqlite' : 'postgres'

// ─── Postgres (Supabase) path ─────────────────────────────────────────────────
function buildPostgresDb() {
  // Drizzle queries use the `postgres` (postgres.js) driver with `prepare: false`
  // so they work correctly against both PgBouncer (port 6543, transaction mode)
  // and the direct connection (port 5432).  Better Auth needs a raw pg.Pool —
  // we give it a separate Pool pointed at the non-pooling URL so it always hits
  // Postgres directly and never goes through PgBouncer.

  if (!postgresUrl) {
    // No database URL is configured yet (e.g. during local dev before a
    // Supabase integration is added).  Return a proxy that throws a clear
    // error at query-time rather than crashing at module-load time.
    const missingDbError = new Error(
      'No database connection string found. ' +
      'Set POSTGRES_URL, POSTGRES_URL_NON_POOLING, or DATABASE_URL in your environment.'
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stub = new Proxy({} as any, {
      get() { throw missingDbError },
    })
    return { db: stub, pool: undefined }
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const postgres = require('postgres') as typeof import('postgres')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require('drizzle-orm/postgres-js') as typeof import('drizzle-orm/postgres-js')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require('pg') as typeof import('pg')

  // postgres.js client for Drizzle — prepare:false is the key PgBouncer fix.
  // ssl.rejectUnauthorized:false is required for Supabase's self-signed CA chain.
  const sqlClient = postgres(postgresUrl, {
    prepare: false,
    ssl: { rejectUnauthorized: false },
    max: 10,
  })

  // pg.Pool for Better Auth — always use the direct (non-pooling) URL if available.
  // We append sslmode=no-verify so that pg's TLS stack accepts Supabase's
  // self-signed intermediate CA chain without requiring the global
  // NODE_TLS_REJECT_UNAUTHORIZED env flag.
  const rawAuthUrl =
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    postgresUrl

  // Ensure ?sslmode=no-verify is present on the URL so every pg.Client
  // spawned from this pool (including those created internally by Better Auth)
  // inherits the correct TLS setting.
  const authUrl = new URL(rawAuthUrl)
  authUrl.searchParams.set('sslmode', 'no-verify')
  const authConnString = authUrl.toString()

  const pgPool = new Pool({
    connectionString: authConnString,
    max: 5,
  })

  return { db: drizzle(sqlClient, { schema }), pool: pgPool }
}

// ─── SQLite (fallback) path ───────────────────────────────────────────────────
function buildSqliteDb() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3') as typeof import('better-sqlite3')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require('drizzle-orm/better-sqlite3') as typeof import('drizzle-orm/better-sqlite3')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initSqliteTables } = require('@/lib/db/sqlite-init') as typeof import('@/lib/db/sqlite-init')

  const fs = require('fs') as typeof import('fs')
  const path = require('path') as typeof import('path')
  const dbDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

  const sqlite = new Database(path.join(dbDir, 'local.db'))
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  // Always run DDL + column migrations before any query so the schema is
  // up-to-date regardless of which module was imported first.
  initSqliteTables(sqlite)

  return { db: drizzle(sqlite, { schema }), sqlite }
}

// Build the appropriate instance once and re-export it
let _db: any // ReturnType<typeof buildPostgresDb>['db'] | ReturnType<typeof buildSqliteDb>['db']
let _pool: import('pg').Pool | undefined
let _sqlite: import('better-sqlite3').Database | undefined

if (driver === 'postgres') {
  const { db, pool } = buildPostgresDb()
  _db = db
  _pool = pool
} else if (driver === 'sqlite') {
  const { db, sqlite } = buildSqliteDb()
  _db = db
  _sqlite = sqlite
} else {
  // 'gas' driver (Hybrid architecture)
  // We still initialize SQLite because Better Auth needs it for sessions/users
  const { db, sqlite } = buildSqliteDb()
  _db = db
  _sqlite = sqlite
}

/**
 * Drizzle ORM instance — works with both Postgres and SQLite.
 *
 * Typed as `any` to avoid TS complaining about the cross-dialect union when
 * action files call .select()/.insert()/.update()/.delete() with pg-core tables.
 * Runtime behaviour is correct because the active driver was chosen at startup.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: any = _db

/**
 * Raw pg.Pool — only defined when running against Postgres.
 * Used by Better Auth's pg adapter.
 */
export const pool = _pool

/**
 * Raw better-sqlite3 Database — only defined when running against SQLite.
 * Used by Better Auth's sqlite adapter.
 */
export const sqliteDb = _sqlite
