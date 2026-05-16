import { StudyStatsCard } from '@/components/dashboard/BalanceCard'
import { StudyProgressChart } from '@/components/dashboard/SpendingTrendChart'
import { SubjectBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { RecentMaterials } from '@/components/dashboard/RecentTransactions'
import { LearningScore } from '@/components/dashboard/FinancialHealthScore'
import { LearningInsightsPanel } from '@/components/dashboard/AIInsightsPanel'

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Top row — study overview */}
      <div className="grid grid-cols-1 gap-5">
        <StudyStatsCard />
      </div>

      {/* Middle row — chart + learning score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <StudyProgressChart />
        </div>
        <div>
          <LearningScore />
        </div>
      </div>

      {/* Bottom row — subjects + materials + insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div>
          <SubjectBreakdown />
        </div>
        <div>
          <RecentMaterials />
        </div>
        <div>
          <LearningInsightsPanel />
        </div>
      </div>
    </div>
  )
}
