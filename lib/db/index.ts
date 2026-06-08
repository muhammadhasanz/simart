/**
 * Database driver factory
 *
 * Priority:
 *  1. Supabase / any Postgres connection  →  drizzle-orm/node-postgres
 *  2. Fallback                            →  drizzle-orm/better-sqlite3  (local file)
 *
 * Consumers always import { db } from '@/lib/db' and get a Drizzle instance
 * regardless of the active driver.  The exported `driver` string lets other
 * modules (e.g. lib/auth.ts) know which path is active without re-checking
 * the env vars themselves.
 */

import * as schema from './schema'

// Determine which driver to use at module-load time so the choice is stable
// for the lifetime of the process.
//
// IMPORTANT: Prefer POSTGRES_URL_NON_POOLING (direct connection, port 5432)
// over the pooled PgBouncer URL (port 6543).  PgBouncer runs in transaction
// mode on Supabase, which is incompatible with node-postgres's pool — it
// breaks prepared statements, advisory locks, and even simple queries like
// `select count(*) from "families"` when the pool tries to reuse sessions.
const postgresUrl =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL

export const driver: 'postgres' | 'sqlite' = postgresUrl ? 'postgres' : 'sqlite'

// ─── Postgres (Supabase) path ─────────────────────────────────────────────────
function buildPostgresDb() {
  // Drizzle queries use the `postgres` (postgres.js) driver with `prepare: false`
  // so they work correctly against both PgBouncer (port 6543, transaction mode)
  // and the direct connection (port 5432).  Better Auth needs a raw pg.Pool —
  // we give it a separate Pool pointed at the non-pooling URL so it always hits
  // Postgres directly and never goes through PgBouncer.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const postgres = require('postgres') as typeof import('postgres')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require('drizzle-orm/postgres-js') as typeof import('drizzle-orm/postgres-js')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require('pg') as typeof import('pg')

  // postgres.js client for Drizzle — prepare:false is the key PgBouncer fix
  const sqlClient = postgres(postgresUrl!, {
    prepare: false,
    ssl: 'require',
    max: 10,
  })

  // pg.Pool for Better Auth — always use the direct (non-pooling) URL if available
  const authConnString =
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    postgresUrl!
  const pgPool = new Pool({
    connectionString: authConnString,
    ssl: { rejectUnauthorized: false },
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

  const fs = require('fs') as typeof import('fs')
  const path = require('path') as typeof import('path')
  const dbDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

  const sqlite = new Database(path.join(dbDir, 'local.db'))
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  return { db: drizzle(sqlite, { schema }), sqlite }
}

// Build the appropriate instance once and re-export it
let _db: ReturnType<typeof buildPostgresDb>['db'] | ReturnType<typeof buildSqliteDb>['db']
let _pool: import('pg').Pool | undefined
let _sqlite: import('better-sqlite3').Database | undefined

if (driver === 'postgres') {
  const { db, pool } = buildPostgresDb()
  _db = db
  _pool = pool
} else {
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
