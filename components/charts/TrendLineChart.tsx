'use client'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'
import { MOCK_WEEKLY_TREND } from '@/data/mockData'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass border border-white/10 rounded-xl p-3 shadow-2xl text-xs sm:text-sm">
      <p className="text-xs text-muted-foreground mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs sm:text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-semibold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

interface TrendLineChartProps {
  data?: typeof MOCK_WEEKLY_TREND
  height?: number
}

export function TrendLineChart({ data = MOCK_WEEKLY_TREND, height = 220 }: TrendLineChartProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const margins = isMobile
    ? { top: 10, right: 0, left: -20, bottom: 0 }
    : { top: 10, right: 4, left: -10, bottom: 0 }

  return (
    <div className="w-full overflow-hidden">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={margins}>
          <defs>
            <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="flashGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="matGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: isMobile ? 10 : 11, fill: 'rgba(148,163,184,0.8)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: isMobile ? 10 : 11, fill: 'rgba(148,163,184,0.8)' }}
            axisLine={false}
            tickLine={false}
            width={isMobile ? 25 : 30}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="hoursStudied"       stroke="#6366f1" strokeWidth={2} fill="url(#hoursGrad)" dot={false} name="hours"      />
          <Area type="monotone" dataKey="flashcardsReviewed" stroke="#10b981" strokeWidth={2} fill="url(#flashGrad)" dot={false} name="flashcards"  />
          <Area type="monotone" dataKey="materialsCompleted" stroke="#8b5cf6" strokeWidth={2} fill="url(#matGrad)"   dot={false} name="materials"   />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
