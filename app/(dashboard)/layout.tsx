import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { HydrateStores } from '@/components/layout/HydrateStores'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <HydrateStores>
      <div className="flex h-[100dvh] bg-background overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:flex">
          <TopBar />
          <main className="flex-1 overflow-y-auto -webkit-overflow-scrolling touch">
            <div className="p-4 sm:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </HydrateStores>
  )
}
