import { betterAuth } from 'better-auth'
import { driver, pool, sqliteDb } from '@/lib/db'

// Build the database option that Better Auth expects:
//  • Postgres  → pass the raw pg.Pool (Better Auth auto-detects pg dialect)
//  • SQLite    → pass { type: 'sqlite', db: <better-sqlite3 instance> }
const authDatabase =
  driver === 'postgres'
    ? pool!
    : sqliteDb!

export const auth = betterAuth({
  database: authDatabase,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
      advanced: {
        defaultCookieAttributes: {
          sameSite: 'none' as const,
          secure: true,
        },
      },
    }
    : {}),
})
