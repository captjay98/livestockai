/**
 * Module Settings Page
 *
 * Enable or disable livestock modules for the farm.
 */

import { createFileRoute } from '@tanstack/react-router'
import { Boxes } from 'lucide-react'

import { useFarm } from '~/features/farms/context'
import { ModuleSelector } from '~/components/modules/selector'

export const Route = createFileRoute('/_auth/settings/modules')({
  component: ModuleSettingsPage,
})

function ModuleSettingsPage() {
  const { selectedFarmId } = useFarm()

  if (!selectedFarmId) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Feature Modules</h3>
          <p className="text-sm text-muted-foreground">
            Please select a farm to manage its modules.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Boxes className="h-6 w-6" />
        <div>
          <h3 className="text-lg font-medium">Feature Modules</h3>
          <p className="text-sm text-muted-foreground">
            Enable or disable livestock management features for your selected
            farm.
          </p>
        </div>
      </div>

      <ModuleSelector />
    </div>
  )
}
