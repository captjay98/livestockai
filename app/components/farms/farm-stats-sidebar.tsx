import { TrendingDown, TrendingUp, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SummaryCard } from '~/components/ui/summary-card'
import { useFormatCurrency } from '~/features/settings'

interface FarmStatsSidebarProps {
  stats: {
    batches: {
      totalLivestock: number
      active: number
    }
    sales: {
      revenue: number
      count: number
    }
    expenses: {
      amount: number
      count: number
    }
  }
}

export function FarmStatsSidebar({ stats }: FarmStatsSidebarProps) {
  const { t } = useTranslation(['farms'])
  const { format: formatCurrency } = useFormatCurrency()

  return (
    <div className="space-y-6">
      <SummaryCard
        title={t('farms:dashboard.livestock')}
        value={stats.batches.totalLivestock.toLocaleString()}
        icon={Users}
        description={t('farms:dashboard.activeBatches', {
          count: stats.batches.active,
        })}
      />
      <SummaryCard
        title={t('farms:dashboard.revenue')}
        value={formatCurrency(stats.sales.revenue)}
        icon={TrendingUp}
        description={t('farms:dashboard.salesTransactions', {
          count: stats.sales.count,
        })}
      />
      <SummaryCard
        title={t('farms:dashboard.expenses')}
        value={formatCurrency(stats.expenses.amount)}
        icon={TrendingDown}
        description={t('farms:dashboard.expenseRecords', {
          count: stats.expenses.count,
        })}
      />
      <div className="p-5 rounded-2xl bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/10 backdrop-blur-md text-sm text-foreground/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-16 translate-x-16 pointer-events-none" />
        <h4 className="font-bold text-foreground mb-1.5 relative z-10">
          {t('farms:quickActions.tip.title')}
        </h4>
        <p className="leading-relaxed relative z-10">
          {t('farms:quickActions.tip.text')}
        </p>
      </div>
    </div>
  )
}
