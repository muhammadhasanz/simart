export async function generateFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return ''

  const components = [
    navigator.userAgent,
    screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || 'unknown',
  ]

  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('Simart Anti-Duplication Fingerprint', 2, 2)
      components.push(canvas.toDataURL())
    }
  } catch (e) {
    // Ignore canvas errors
  }

  const rawFingerprint = components.join('|||')
  
  // Hash the fingerprint string using SHA-256 (SubtleCrypto)
  const encoder = new TextEncoder()
  const data = encoder.encode(rawFingerprint)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

export function getOrCreateVoterToken(): string {
  if (typeof window === 'undefined') return ''

  const KEY = 'voter_token'
  let token = localStorage.getItem(KEY)

  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(KEY, token)
  }

  return token
}
