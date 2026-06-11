'use client'

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ReligionChartProps {
  data: { religion: string | null; count: number }[]
}

const COLORS = [
  '#f59e0b',
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
]

const religionLabels: Record<string, string> = {
  islam: 'Islam',
  kristen: 'Kristen',
  katolik: 'Katolik',
  hindu: 'Hindu',
  buddha: 'Buddha',
  konghucu: 'Konghucu',
}

export function ReligionChart({ data }: ReligionChartProps) {
  const chartData = data.map((item) => ({
    name: religionLabels[item.religion?.toLowerCase() || ''] || item.religion || 'Lainnya',
    value: Number(item.count),
  }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Komposisi Agama
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Belum ada data agama
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                }
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} orang`, 'Jumlah']}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
