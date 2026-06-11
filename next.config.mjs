/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['simart.keithritherus.my.id', 'http://localhost:3111'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Native modules and packages with complex CJS/ESM internals must not be
  // bundled by the Next.js server bundler.
  serverExternalPackages: [
    'better-sqlite3',
    'pg',
    'postgres',
    'better-auth',
    'kysely',
    '@better-auth/kysely-adapter',
  ],
}

export default nextConfig
