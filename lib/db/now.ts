/**
 * dbNow()
 *
 * Returns a Drizzle `sql` fragment that evaluates to the current timestamp
 * at the database level, using the correct syntax for the active driver.
 *
 * - SQLite  → datetime('now')
 * - Postgres → now()
 *
 * Use this instead of passing `new Date()` or `new Date().toISOString()` to
 * `.set()` / `.values()` on timestamp columns — both cause type errors when
 * the active driver differs from the schema dialect (pg-core over SQLite).
 */

import { sql } from 'drizzle-orm'
import { driver } from '@/lib/db'

export function dbNow() {
  return driver === 'sqlite'
    ? sql`datetime('now')`
    : sql`now()`
}
