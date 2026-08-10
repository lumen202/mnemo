'use client'
import { AddMaterialModal } from './AddMaterialModal'
import { LogSessionModal } from '@/components/planner/LogSessionModal'
import { AddGoalModal } from '@/components/planner/AddGoalModal'
import { CommandPalette } from '@/components/common/CommandPalette'

/**
 * Every app-wide overlay mounts here (inside the dashboard layout) so any page
 * can open one through `useUIStore` without rendering it locally — dialogs
 * defined inside a page never mount when that page early-returns. See BUG-007.
 */
export function GlobalModals() {
  return (
    <>
      <AddMaterialModal />
      <LogSessionModal />
      <AddGoalModal />
      <CommandPalette />
    </>
  )
}
