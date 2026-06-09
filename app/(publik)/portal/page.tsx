import {
  getPengumumanList,
  getPollsWithOptions,
} from '@/app/actions/informasi'
import { PortalClient } from '@/components/portal/portal-client'

export const dynamic = 'force-dynamic'

export default async function PortalPage() {
  const [pengumumanList, pollsList] = await Promise.all([
    getPengumumanList(),
    getPollsWithOptions(),
  ])

  return (
    <PortalClient
      initialPengumuman={pengumumanList}
      initialPolls={pollsList}
    />
  )
}
