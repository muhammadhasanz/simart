'use client'

import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GenderChartProps {
  male: number
  female: number
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))']

export function GenderChart({ male, female }: GenderChartProps) {
  const data = [
    { name: 'Laki-laki', value: male },
    { name: 'Perempuan', value: female },
  ]

  const total = male + female

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Komposisi Jenis Kelamin
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Belum ada data warga
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((_, index) => (
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
