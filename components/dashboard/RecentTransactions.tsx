'use client'
import Link from 'next/link'
import { ArrowRight, FileText, StickyNote, Video, Link2, BookMarked } from 'lucide-react'
import { GlassCard } from '@/components/common/GlassCard'
import { Badge } from '@/components/ui/badge'
import { useStudyMaterialStore } from '@/store'
import { SUBJECT_META } from '@/data/mockData'
import { getMaterialStatusColor } from '@/utils/analytics'
import { cn } from '@/lib/utils'
import type { MaterialType, MaterialStatus } from '@/types'

const TYPE_ICONS: Record<MaterialType, typeof FileText> = {
  pdf:      FileText,
  note:     StickyNote,
  video:    Video,
  link:     Link2,
  textbook: BookMarked,
}

const STATUS_LABELS: Record<MaterialStatus, string> = {
  pending:   'Pending',
  summarized: 'Summarized',
  reviewed:  'Reviewed',
  mastered:  'Mastered',
}

export function RecentMaterials() {
  const { materials } = useStudyMaterialStore()
  const recent = materials.slice(0, 6)

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recent Materials</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{materials.length} total uploaded</p>
        </div>
        <Link
          href="/materials"
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      <div className="space-y-1">
        {recent.map((mat, i) => {
          const meta = SUBJECT_META[mat.subject]
          const IconComp = TYPE_ICONS[mat.type] ?? FileText
          const statusColor = getMaterialStatusColor(mat.status)

          return (
            <div
              key={mat.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', meta?.bg ?? 'bg-slate-500/20')}
              >
                <IconComp className="w-4 h-4" style={{ color: meta?.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate leading-tight">{mat.title}</p>
                <p className="text-xs text-muted-foreground truncate">{meta?.label ?? mat.subject}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn('text-xs font-semibold', statusColor)}>
                  {STATUS_LABELS[mat.status]}
                </p>
                <p className="text-xs text-muted-foreground">{mat.uploadDate}</p>
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
