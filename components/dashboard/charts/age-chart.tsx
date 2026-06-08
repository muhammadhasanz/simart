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

interface AgeChartProps {
  data: { age_group: string; count: number }[]
}

export function AgeChart({ data }: AgeChartProps) {
  const chartData = data.map((item) => ({
    name: item.age_group,
    value: Number(item.count),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Distribusi Usia
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Belum ada data usia
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number) => [`${value} orang`, 'Jumlah']}
                labelFormatter={(label) => `Kelompok Usia: ${label} tahun`}
              />
              <Bar
                dataKey="value"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
