/**
 * sqlite-init.ts
 *
 * Runs CREATE TABLE IF NOT EXISTS for every table the app needs when the
 * active driver is SQLite (i.e. Supabase / Postgres is not configured).
 *
 * Call this once on server startup (e.g. from lib/auth.ts or a server layout).
 * It is a no-op when called multiple times because of the IF NOT EXISTS guard.
 */

import type { Database } from 'better-sqlite3'

export function initSqliteTables(sqlite: Database) {
  sqlite.exec(`
    -- Better Auth tables -------------------------------------------------------

    CREATE TABLE IF NOT EXISTS "user" (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      "emailVerified" INTEGER NOT NULL DEFAULT 0,
      image         TEXT,
      "createdAt"   TEXT NOT NULL DEFAULT (datetime('now')),
      "updatedAt"   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS session (
      id            TEXT PRIMARY KEY,
      "expiresAt"   TEXT NOT NULL,
      token         TEXT NOT NULL UNIQUE,
      "createdAt"   TEXT NOT NULL DEFAULT (datetime('now')),
      "updatedAt"   TEXT NOT NULL DEFAULT (datetime('now')),
      "ipAddress"   TEXT,
      "userAgent"   TEXT,
      "userId"      TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS account (
      id                        TEXT PRIMARY KEY,
      "accountId"               TEXT NOT NULL,
      "providerId"              TEXT NOT NULL,
      "userId"                  TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "accessToken"             TEXT,
      "refreshToken"            TEXT,
      "idToken"                 TEXT,
      "accessTokenExpiresAt"    TEXT,
      "refreshTokenExpiresAt"   TEXT,
      scope                     TEXT,
      password                  TEXT,
      "createdAt"               TEXT NOT NULL DEFAULT (datetime('now')),
      "updatedAt"               TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS verification (
      id          TEXT PRIMARY KEY,
      identifier  TEXT NOT NULL,
      value       TEXT NOT NULL,
      "expiresAt" TEXT NOT NULL,
      "createdAt" TEXT DEFAULT (datetime('now')),
      "updatedAt" TEXT DEFAULT (datetime('now'))
    );

    -- App tables ---------------------------------------------------------------

    CREATE TABLE IF NOT EXISTS families (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      family_card_number  TEXT UNIQUE NOT NULL,
      address             TEXT NOT NULL,
      rt                  TEXT NOT NULL DEFAULT '001',
      rw                  TEXT NOT NULL DEFAULT '001',
      village             TEXT,
      district            TEXT,
      city                TEXT,
      province            TEXT,
      postal_code         TEXT,
      created_at          TEXT DEFAULT (datetime('now')),
      updated_at          TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS residents (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id       INTEGER REFERENCES families(id) ON DELETE SET NULL,
      nik             TEXT UNIQUE NOT NULL,
      full_name       TEXT NOT NULL,
      birth_place     TEXT,
      birth_date      TEXT,
      gender          TEXT,
      blood_type      TEXT,
      religion        TEXT,
      marital_status  TEXT,
      occupation      TEXT,
      education       TEXT,
      nationality     TEXT DEFAULT 'WNI',
      phone           TEXT,
      email           TEXT,
      family_status   TEXT,
      photo_url       TEXT,
      resident_status TEXT DEFAULT 'active',
      entry_date      TEXT DEFAULT (date('now')),
      exit_date       TEXT,
      notes           TEXT,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    );
  `)
}
