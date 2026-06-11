import { Suspense } from 'react'
import { PortalClient } from '@/components/portal/portal-client'

export const dynamic = 'force-dynamic'

export default function PortalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Memuat portal...</div>}>
      <PortalClient />
    </Suspense>
  )
}
