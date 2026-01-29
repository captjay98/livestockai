import { useTranslation } from 'react-i18next'
import { Building2, Clock, Edit as EditIconLucide } from 'lucide-react'
import type { DashboardFarm } from '~/features/dashboard/types'

interface DashboardHeaderProps {
  selectedFarmId: string | null
  farms: Array<DashboardFarm>
  onEditFarm: (farm: DashboardFarm) => void
}

export function DashboardHeader({
  selectedFarmId,
  farms,
  onEditFarm,
}: DashboardHeaderProps) {
  const { t } = useTranslation(['dashboard', 'common'])

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t('common:dashboard')}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t('subtitle', {
            defaultValue: "Here's what's happening on your farms.",
          })}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {farms.length > 0 && (
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {selectedFarmId
                  ? farms.find((f) => f.id === selectedFarmId)?.name ||
                    farms[0]?.name
                  : t('common:allFarms', {
                      defaultValue: 'All Farms',
                    })}
              </span>
              {selectedFarmId && (
                <button
                  onClick={() =>
                    onEditFarm(farms.find((f) => f.id === selectedFarmId)!)
                  }
                  className="p-1 hover:bg-background rounded transition-colors"
                >
                  <EditIconLucide className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>
            {t('common:lastUpdated', {
              defaultValue: 'Last updated',
            })}
            : {t('common:justNow', { defaultValue: 'Just now' })}
          </span>
        </div>
      </div>
    </div>
  )
}
