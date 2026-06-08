import { StatsCards } from '@/components/dashboard/stats-cards'
import { GenderChart } from '@/components/dashboard/charts/gender-chart'
import { AgeChart } from '@/components/dashboard/charts/age-chart'
import { ReligionChart } from '@/components/dashboard/charts/religion-chart'
import { OccupationChart } from '@/components/dashboard/charts/occupation-chart'
import { RecentResidents } from '@/components/dashboard/recent-residents'
import {
  getResidentStats,
  getAgeDistribution,
  getReligionComposition,
  getOccupationBreakdown,
  getRecentResidents,
} from '@/app/actions/residents'
import { getFamilyStats } from '@/app/actions/families'

export default async function DashboardPage() {
  const [
    residentStats,
    familyStats,
    ageDistribution,
    religionComposition,
    occupationBreakdown,
    recentResidents,
  ] = await Promise.all([
    getResidentStats(),
    getFamilyStats(),
    getAgeDistribution(),
    getReligionComposition(),
    getOccupationBreakdown(),
    getRecentResidents(5),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan data warga dan keluarga RT/RW
        </p>
      </div>

      <StatsCards
        totalResidents={residentStats.total}
        totalFamilies={familyStats.total}
        maleCount={residentStats.male}
        femaleCount={residentStats.female}
        newThisMonth={residentStats.newThisMonth}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <GenderChart male={residentStats.male} female={residentStats.female} />
        <AgeChart data={ageDistribution} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ReligionChart data={religionComposition} />
        <OccupationChart data={occupationBreakdown} />
      </div>

      <RecentResidents residents={recentResidents} />
    </div>
  )
}
