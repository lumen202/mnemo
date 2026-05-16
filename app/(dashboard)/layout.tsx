import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { HydrateStores } from '@/components/layout/HydrateStores'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <HydrateStores>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </HydrateStores>
  )
}
