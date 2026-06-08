# =============================================================
# Stage 1: deps - Install dependencies only
# =============================================================
FROM node:20-alpine AS deps

# Install libc6-compat untuk kompatibilitas Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies sesuai package manager yang digunakan
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# =============================================================
# Stage 2: builder - Build aplikasi
# =============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy node_modules dari stage deps
COPY --from=deps /app/node_modules ./node_modules

# Copy seluruh source code
COPY . .

# Nonaktifkan telemetry Next.js selama build
ENV NEXT_TELEMETRY_DISABLED=1

# Build aplikasi Next.js
RUN \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else npm run build; \
  fi

# =============================================================
# Stage 3: runner - Production image (minimal)
# =============================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Buat user non-root untuk keamanan
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy file public dan build output
COPY --from=builder /app/public ./public

# Aktifkan standalone output di next.config.js agar image lebih kecil
# (tambahkan output: 'standalone' di next.config.js)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Gunakan user non-root
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Jalankan server Next.js (standalone mode)
CMD ["node", "server.js"]
