import { Beef, Bird, Cloud, Fish, Hexagon, Package, Rabbit } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '~/lib/utils'

interface InventoryStatsProps {
  stats: any
  enabledModules: Array<string>
  cards: any
}

export function InventoryStats({
  stats,
  enabledModules,
  cards,
}: InventoryStatsProps) {
  const { t } = useTranslation(['dashboard', 'common', 'batches'])

  if (!cards.inventory || enabledModules.length === 0) return null

  const LIVESTOCK_CARDS = {
    poultry: {
      icon: Bird,
      label: t('batches:poultry'),
      bgClass: 'bg-primary/20',
      textClass: 'text-primary',
      count: stats.inventory.totalPoultry || 0,
    },
    aquaculture: {
      icon: Fish,
      label: t('batches:fish'),
      bgClass: 'bg-blue-500/20',
      textClass: 'text-blue-500',
      count: stats.inventory.totalFish || 0,
    },
    cattle: {
      icon: Beef,
      label: t('common:cattle', { defaultValue: 'Cattle' }),
      bgClass: 'bg-orange-500/20',
      textClass: 'text-orange-500',
      count: stats.inventory.totalCattle || 0,
    },
    goats: {
      icon: Rabbit,
      label: t('common:goats', { defaultValue: 'Goats' }),
      bgClass: 'bg-green-500/20',
      textClass: 'text-green-500',
      count: stats.inventory.totalGoats || 0,
    },
    sheep: {
      icon: Cloud,
      label: t('common:sheep', { defaultValue: 'Sheep' }),
      bgClass: 'bg-purple-500/20',
      textClass: 'text-purple-500',
      count: stats.inventory.totalSheep || 0,
    },
    bees: {
      icon: Hexagon,
      label: t('common:bees', { defaultValue: 'Bees' }),
      bgClass: 'bg-amber-500/20',
      textClass: 'text-amber-500',
      count: stats.inventory.totalBees || 0,
    },
  } as const

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        {t('common:inventory', { defaultValue: 'Inventory' })}
      </h3>

      <div className="grid gap-3 sm:gap-4 grid-cols-2">
        {enabledModules.map((moduleKey) => {
          const config =
            LIVESTOCK_CARDS[moduleKey as keyof typeof LIVESTOCK_CARDS]
          const Icon = config.icon

          return (
            <div
              key={moduleKey}
              className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm transition-all hover:scale-[1.03]"
            >
              <div
                className={cn(
                  'p-2.5 rounded-xl transition-colors',
                  config.bgClass,
                )}
              >
                <Icon className={cn('h-5 w-5', config.textClass)} />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                  {config.count.toLocaleString()}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider text-center leading-tight">
                  {config.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
