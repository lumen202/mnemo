'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { SubjectStudy } from '@/types'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: SubjectStudy }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="glass border border-white/10 rounded-xl p-3 shadow-2xl">
      <p className="text-xs font-semibold text-foreground">{item.subjectName}</p>
      <p className="text-sm font-bold text-foreground mt-1">{item.hoursStudied}h studied</p>
      <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}% of total time</p>
    </div>
  )
}

interface CategoryPieChartProps {
  data: SubjectStudy[]
  size?: number
}

export function CategoryPieChart({ data, size = 160 }: CategoryPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={size}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={size * 0.28}
          outerRadius={size * 0.44}
          paddingAngle={2}
          dataKey="hoursStudied"
          nameKey="subjectName"
          strokeWidth={0}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} opacity={0.9} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}
