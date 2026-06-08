import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Home, UserPlus, UsersRound } from 'lucide-react'

interface StatsCardsProps {
  totalResidents: number
  totalFamilies: number
  maleCount: number
  femaleCount: number
  newThisMonth: number
}

export function StatsCards({
  totalResidents,
  totalFamilies,
  maleCount,
  femaleCount,
  newThisMonth,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Warga
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalResidents}</div>
          <p className="text-xs text-muted-foreground">
            Warga aktif terdaftar
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Keluarga
          </CardTitle>
          <Home className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalFamilies}</div>
          <p className="text-xs text-muted-foreground">
            Kartu Keluarga terdaftar
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Komposisi Gender
          </CardTitle>
          <UsersRound className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {maleCount} / {femaleCount}
          </div>
          <p className="text-xs text-muted-foreground">
            Laki-laki / Perempuan
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Warga Baru
          </CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{newThisMonth}</div>
          <p className="text-xs text-muted-foreground">
            Terdaftar bulan ini
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
