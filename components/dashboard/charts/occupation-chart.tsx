'use client'

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OccupationChartProps {
  data: { occupation: string | null; count: number }[]
}

export function OccupationChart({ data }: OccupationChartProps) {
  const chartData = data
    .filter((item) => item.occupation)
    .map((item) => ({
      name: item.occupation || 'Lainnya',
      value: Number(item.count),
    }))
    .slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Komposisi Pekerjaan
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Belum ada data pekerjaan
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                formatter={(value: number) => [`${value} orang`, 'Jumlah']}
              />
              <Bar
                dataKey="value"
                fill="hsl(var(--chart-3))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
