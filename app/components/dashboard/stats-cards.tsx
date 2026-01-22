import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Beef,
  Bird,
  Cloud,
  Fish,
  Hexagon,
  Rabbit,
  Users,
  Wheat,
} from 'lucide-react'
import { Card, CardContent } from '~/components/ui/card'
import { cn } from '~/lib/utils'

interface StatsCardsProps {
  stats: any
  cards: any
  enabledModules: Array<string>
  currencySymbol: string
  formatCurrency: (val: number) => string
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  )
}

function TrendingDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 18l-9.5-9.5-5 5L1 6" />
      <path d="M17 18h6v-6" />
    </svg>
  )
}

export function StatsCards({
  stats,
  cards,
  enabledModules,
  currencySymbol,
  formatCurrency,
}: StatsCardsProps) {
  const { t } = useTranslation(['dashboard', 'common', 'batches'])

  const LIVESTOCK_CARDS = {
    poultry: {
      icon: Bird,
      label: t('batches:poultry'),
      bgClass: 'bg-primary/10',
      textClass: 'text-primary',
      count: stats.inventory.totalPoultry || 0,
    },
    aquaculture: {
      icon: Fish,
      label: t('batches:fish'),
      bgClass: 'bg-blue-100 dark:bg-blue-900/30',
      textClass: 'text-blue-600 dark:text-blue-400',
      count: stats.inventory.totalFish || 0,
    },
    cattle: {
      icon: Beef,
      label: t('common:cattle', { defaultValue: 'Cattle' }),
      bgClass: 'bg-orange-100 dark:bg-orange-900/30',
      textClass: 'text-orange-600 dark:text-orange-400',
      count: stats.inventory.totalCattle || 0,
    },
    goats: {
      icon: Rabbit,
      label: t('common:goats', { defaultValue: 'Goats' }),
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      textClass: 'text-green-600 dark:text-green-400',
      count: stats.inventory.totalGoats || 0,
    },
    sheep: {
      icon: Cloud,
      label: t('common:sheep', { defaultValue: 'Sheep' }),
      bgClass: 'bg-purple-100 dark:bg-purple-900/30',
      textClass: 'text-purple-600 dark:text-purple-400',
      count: stats.inventory.totalSheep || 0,
    },
    bees: {
      icon: Hexagon,
      label: t('common:bees', { defaultValue: 'Bees' }),
      bgClass: 'bg-amber-100 dark:bg-amber-900/30',
      textClass: 'text-amber-600 dark:text-amber-400',
      count: stats.inventory.totalBees || 0,
    },
  } as const

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.revenue && (
          <Card>
            <CardContent className="p-3 shadow-none">
              <div className="flex flex-row items-center justify-between space-y-0 pb-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('common:revenue', { defaultValue: 'Revenue' })}
                </p>
                <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}
                  </span>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold">
                {formatCurrency(stats.financial.monthlyRevenue)}
              </div>
              {stats.financial.revenueChange !== undefined && (
                <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                  <span
                    className={cn(
                      'flex items-center gap-0.5 font-medium',
                      stats.financial.revenueChange >= 0
                        ? 'text-emerald-600'
                        : 'text-red-600',
                    )}
                  >
                    {stats.financial.revenueChange >= 0 ? (
                      <TrendingUpIcon className="h-3 w-3" />
                    ) : (
                      <TrendingDownIcon className="h-3 w-3" />
                    )}
                    {stats.financial.revenueChange >= 0 ? '+' : ''}
                    {stats.financial.revenueChange.toFixed(1)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {cards.expenses && (
          <Card>
            <CardContent className="p-3 shadow-none">
              <div className="flex flex-row items-center justify-between space-y-0 pb-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('common:expenses', { defaultValue: 'Expenses' })}
                </p>
                <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <span className="font-bold text-xs text-red-600 dark:text-red-400">
                    {currencySymbol}
                  </span>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold">
                {formatCurrency(stats.financial.monthlyExpenses)}
              </div>
              {stats.financial.expensesChange !== undefined && (
                <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                  <span
                    className={cn(
                      'flex items-center gap-0.5 font-medium',
                      stats.financial.expensesChange >= 0
                        ? 'text-red-600'
                        : 'text-emerald-600',
                    )}
                  >
                    {stats.financial.expensesChange >= 0 ? (
                      <TrendingUpIcon className="h-3 w-3" />
                    ) : (
                      <TrendingDownIcon className="h-3 w-3" />
                    )}
                    {stats.financial.expensesChange >= 0 ? '+' : ''}
                    {stats.financial.expensesChange.toFixed(1)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {cards.profit && (
          <Card>
            <CardContent className="p-3 shadow-none">
              <div className="flex flex-row items-center justify-between space-y-0 pb-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('common:profit', { defaultValue: 'Profit' })}
                </p>
                <div
                  className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center shrink-0',
                    stats.financial.monthlyProfit >= 0
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-red-100 dark:bg-red-900/30',
                  )}
                >
                  <span
                    className={cn(
                      'font-bold text-xs',
                      stats.financial.monthlyProfit >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {currencySymbol}
                  </span>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold">
                {formatCurrency(stats.financial.monthlyProfit)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {t('netMargin', { defaultValue: 'Net margin' })}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-3 shadow-none">
            <div className="flex flex-row items-center justify-between space-y-0 pb-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t('common:batches', { defaultValue: 'Batches' })}
              </p>
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Users className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold">
              {stats.inventory.activeBatches}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t('active', { defaultValue: 'Active' })}
            </p>
          </CardContent>
        </Card>

        {cards.mortality && (
          <Card>
            <CardContent className="p-3 shadow-none">
              <div className="flex flex-row items-center justify-between space-y-0 pb-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('common:mortality', { defaultValue: 'Mortality' })}
                </p>
                <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold">
                {stats.mortality.totalDeaths}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {stats.mortality.mortalityRate.toFixed(1)}
                {t('rate', { defaultValue: '% rate' })}
              </p>
            </CardContent>
          </Card>
        )}

        {cards.feed && (
          <Card>
            <CardContent className="p-3 shadow-none">
              <div className="flex flex-row items-center justify-between space-y-0 pb-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('common:feed', { defaultValue: 'Feed' })}
                </p>
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Wheat className="h-3 w-3 text-primary" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold">
                {formatCurrency(stats.feed.totalCost)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {t('common:feed', { defaultValue: 'Feed' })} FCR:{' '}
                {stats.feed.fcr.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {cards.inventory && enabledModules.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {enabledModules.map((moduleKey) => {
            const config =
              LIVESTOCK_CARDS[moduleKey as keyof typeof LIVESTOCK_CARDS]
            const Icon = config.icon

            return (
              <Card key={moduleKey}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                        config.bgClass,
                      )}
                    >
                      <Icon className={cn('h-5 w-5', config.textClass)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {config.label}
                      </p>
                      <p className="text-lg sm:text-xl font-bold">
                        {config.count.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
