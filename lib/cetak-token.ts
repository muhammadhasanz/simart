/**
 * Encrypted print-page token helper.
 *
 * Uses AES-256-GCM (Node built-in `crypto` — zero new dependencies).
 * The 256-bit key is derived from BETTER_AUTH_SECRET via SHA-256 so we reuse
 * the existing secret without schema changes.
 *
 * Token format (URL-safe base64):
 *   <12-byte IV> | <ciphertext> | <16-byte auth tag>
 *
 * Works in the Node.js runtime (server actions, route handlers, RSCs).
 * Never called on the client.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

// ── Key derivation ─────────────────────────────────────────────────────────────

const DEV_FALLBACK_SECRET = 'simart-dev-only-secret-do-not-use-in-production'

function deriveKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error(
      'BETTER_AUTH_SECRET is not set. Add it to your environment variables.'
    )
  }
  // SHA-256 of the secret → 32 bytes → AES-256 key
  return createHash('sha256').update(secret ?? DEV_FALLBACK_SECRET).digest()
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function toUrlSafeBase64(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromUrlSafeBase64(str: string): Buffer {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(b64, 'base64')
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Encrypts a numeric or string surat-pengantar ID into a URL-safe token.
 * The token is safe to embed directly in a URL path segment.
 */
export function encryptCetakId(id: string | number): string {
  const key = deriveKey()
  const iv = randomBytes(12) // 96-bit IV recommended for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv)

  const plaintext = Buffer.from(String(id), 'utf8')
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const authTag = cipher.getAuthTag() // 16 bytes

  // Concatenate: IV (12) + ciphertext + authTag (16)
  const combined = Buffer.concat([iv, encrypted, authTag])
  return toUrlSafeBase64(combined)
}

/**
 * Decrypts a token produced by `encryptCetakId`.
 * Returns the original ID, or `null` if the token is invalid/tampered.
 */
export function decryptCetakToken(token: string): string | null {
  try {
    const key = deriveKey()
    const combined = fromUrlSafeBase64(token)

    // Minimum length: 12 (IV) + 1 (ciphertext) + 16 (tag) = 29 bytes
    if (combined.length < 29) return null

    const iv = combined.subarray(0, 12)
    const authTag = combined.subarray(combined.length - 16)
    const ciphertext = combined.subarray(12, combined.length - 16)

    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    const idStr = decrypted.toString('utf8')

    return idStr || null
  } catch {
    // Decryption failure (tampered token, wrong key, etc.)
    return null
  }
}
