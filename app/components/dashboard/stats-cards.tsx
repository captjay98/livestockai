import { useTranslation } from 'react-i18next'
import { AlertTriangle, Users, Wheat } from 'lucide-react'
import { EnvironmentalCards } from './environmental-cards'
import { SummaryCard } from '~/components/ui/summary-card'
import { cn } from '~/lib/utils'

interface StatsData {
  financial: {
    monthlyRevenue: number
    monthlyExpenses: number
    monthlyProfit: number
    revenueChange?: number
    expensesChange?: number
  }
  inventory: {
    activeBatches: number
  }
  mortality: {
    totalDeaths: number
    mortalityRate: number
  }
  feed: {
    totalCost: number
    fcr: number
  }
}

interface CardsConfig {
  revenue?: boolean
  expenses?: boolean
  profit?: boolean
  mortality?: boolean
  feed?: boolean
}

interface StatsCardsProps {
  stats: StatsData
  cards: CardsConfig
  enabledModules?: Array<string>
  currencySymbol: string
  formatCurrency: (val: number) => string
}

export function StatsCards({
  stats,
  cards,
  currencySymbol,
  formatCurrency,
}: StatsCardsProps) {
  const { t } = useTranslation(['dashboard', 'common', 'batches'])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        {cards.revenue && (
          <SummaryCard
            title={t('common:revenue', { defaultValue: 'Revenue' })}
            value={formatCurrency(stats.financial.monthlyRevenue)}
            icon={() => (
              <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                {currencySymbol}
              </span>
            )}
            iconClassName="bg-emerald-500/20 rounded-full"
            trend={
              stats.financial.revenueChange !== undefined
                ? {
                    value: stats.financial.revenueChange,
                    isPositive: stats.financial.revenueChange >= 0,
                  }
                : undefined
            }
            description={
              stats.financial.revenueChange !== undefined
                ? t('dashboard:vsLastMonth', { defaultValue: 'vs last month' })
                : undefined
            }
          />
        )}

        {cards.expenses && (
          <SummaryCard
            title={t('common:expenses', { defaultValue: 'Expenses' })}
            value={formatCurrency(stats.financial.monthlyExpenses)}
            icon={() => (
              <span className="font-bold text-xs text-red-600 dark:text-red-400">
                {currencySymbol}
              </span>
            )}
            iconClassName="bg-red-500/20 rounded-full"
            trend={
              stats.financial.expensesChange !== undefined
                ? {
                    value: stats.financial.expensesChange,
                    isPositive: stats.financial.expensesChange < 0,
                  }
                : undefined
            }
            description={
              stats.financial.expensesChange !== undefined
                ? t('dashboard:vsLastMonth', { defaultValue: 'vs last month' })
                : undefined
            }
          />
        )}

        {cards.profit && (
          <SummaryCard
            title={t('common:profit', { defaultValue: 'Profit' })}
            value={formatCurrency(stats.financial.monthlyProfit)}
            icon={() => (
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
            )}
            iconClassName={cn(
              'rounded-full',
              stats.financial.monthlyProfit >= 0
                ? 'bg-emerald-500/20'
                : 'bg-red-500/20',
            )}
            description={t('netMargin', { defaultValue: 'Net margin' })}
          />
        )}

        <SummaryCard
          title={t('common:batches', { defaultValue: 'Batches' })}
          value={stats.inventory.activeBatches}
          icon={Users}
          iconClassName="bg-primary/20 rounded-full"
          description={t('active', { defaultValue: 'Active' })}
        />

        {cards.mortality && (
          <SummaryCard
            title={t('common:mortality', { defaultValue: 'Mortality' })}
            value={stats.mortality.totalDeaths}
            icon={AlertTriangle}
            iconClassName="bg-destructive/20 text-destructive rounded-full"
            description={`${stats.mortality.mortalityRate.toFixed(1)}${t('rate', { defaultValue: '% rate' })}`}
          />
        )}

        {cards.feed && (
          <SummaryCard
            title={t('common:feed', { defaultValue: 'Feed' })}
            value={formatCurrency(stats.feed.totalCost)}
            icon={Wheat}
            iconClassName="bg-amber-500/20 text-amber-500 rounded-full"
            description={`${t('common:feed', { defaultValue: 'Feed' })} FCR: ${stats.feed.fcr.toFixed(2)}`}
          />
        )}

        <EnvironmentalCards />
      </div>
    </div>
  )
}
