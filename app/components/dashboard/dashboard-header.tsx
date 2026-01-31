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
    <div className="flex flex-col gap-6 relative z-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t('common:dashboard')}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base font-medium">
            {t('subtitle', {
              defaultValue: "Here's what's happening on your farms.",
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {farms.length > 0 && (
            <div className="flex items-center gap-2 bg-white/40 dark:bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 dark:border-white/10 shadow-sm transition-transform hover:scale-[1.02]">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground/80">
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
                  className="ml-1 p-1.5 hover:bg-white/20 rounded-lg transition-colors group"
                >
                  <EditIconLucide className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              )}
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-white/30 dark:bg-black/30 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {t('common:updated', { defaultValue: 'Updated' })}:{' '}
              {t('common:justNow', { defaultValue: 'Just now' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
