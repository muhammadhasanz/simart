import { Suspense } from 'react'
import {
  getPengumumanList,
  getPollsWithOptions,
} from '@/app/actions/informasi'
import { PortalClient } from '@/components/portal/portal-client'
import {
  getResidentStats,
  getAgeDistribution,
  getReligionComposition,
  getOccupationBreakdown,
} from '@/app/actions/residents'
import { getFamilyStats } from '@/app/actions/families'
import { getKasIuranList, getKasIuranSummary } from '@/app/actions/kas-iuran'

export const dynamic = 'force-dynamic'

export default async function PortalPage() {
  const [
    pengumumanList,
    pollsList,
    residentStats,
    familyStats,
    ageDistribution,
    religionComposition,
    occupationBreakdown,
    kasIuranList,
    kasIuranSummary,
  ] = await Promise.all([
    getPengumumanList(),
    getPollsWithOptions(),
    getResidentStats(),
    getFamilyStats(),
    getAgeDistribution(),
    getReligionComposition(),
    getOccupationBreakdown(),
    getKasIuranList(),
    getKasIuranSummary(),
  ])

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Memuat portal...</div>}>
      <PortalClient
        initialPengumuman={pengumumanList}
        initialPolls={pollsList}
        residentStats={residentStats}
        familyStats={familyStats}
        ageDistribution={ageDistribution}
        religionComposition={religionComposition}
        occupationBreakdown={occupationBreakdown}
        kasIuranList={kasIuranList}
        kasIuranSummary={kasIuranSummary}
      />
    </Suspense>
  )
}
