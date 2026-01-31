import { useTranslation } from 'react-i18next'
import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import type { ProfitLossReport } from '~/features/reports/server'
import { useFormatCurrency } from '~/features/settings'
import { SummaryCard } from '~/components/ui/summary-card'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/utils'

export function ProfitLossReportView({ report }: { report: ProfitLossReport }) {
  const { format: formatCurrency } = useFormatCurrency()
  const { t } = useTranslation(['reports', 'common'])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title={t('profitLoss.totalRevenue', {
            defaultValue: 'Total Revenue',
          })}
          value={formatCurrency(report.revenue.total)}
          icon={TrendingUp}
          iconClassName="bg-emerald-500/20 text-emerald-500"
          valueClassName="text-2xl font-bold text-emerald-500"
        />
        <SummaryCard
          title={t('profitLoss.totalExpenses', {
            defaultValue: 'Total Expenses',
          })}
          value={formatCurrency(report.expenses.total)}
          icon={TrendingDown}
          iconClassName="bg-destructive/10 text-destructive"
          valueClassName="text-2xl font-bold text-destructive"
        />
        <SummaryCard
          title={t('profitLoss.netProfit', { defaultValue: 'Net Profit' })}
          value={formatCurrency(report.profit)}
          icon={Wallet}
          iconClassName={cn(
            report.profit >= 0
              ? 'bg-emerald-500/20 text-emerald-500'
              : 'bg-destructive/10 text-destructive',
          )}
          valueClassName={cn(
            'text-2xl font-bold',
            report.profit >= 0 ? 'text-emerald-500' : 'text-destructive',
          )}
          description={
            <span className="flex items-center gap-1 font-medium">
              <span
                className={
                  report.profit >= 0 ? 'text-emerald-600' : 'text-destructive'
                }
              >
                {report.profitMargin}%
              </span>
              <span className="text-muted-foreground opacity-80">
                {t('profitLoss.margin', { defaultValue: 'margin' })}
              </span>
            </span>
          }
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white/40 dark:bg-black/40 backdrop-blur-md border-white/10 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/10 dark:bg-white/5 border-b border-white/10 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <DollarSign className="h-4 w-4" />
              </div>
              {t('profitLoss.revenueByType', {
                defaultValue: 'Revenue by Type',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/10">
              {report.revenue.byType.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <span className="capitalize font-medium text-sm">
                    {t(`common.livestock.${item.type}`, {
                      defaultValue: item.type,
                    })}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              {report.revenue.byType.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No revenue data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/40 dark:bg-black/40 backdrop-blur-md border-white/10 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/10 dark:bg-white/5 border-b border-white/10 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
                <Wallet className="h-4 w-4" />
              </div>
              {t('profitLoss.expensesByCategory', {
                defaultValue: 'Expenses by Category',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/10">
              {report.expenses.byCategory.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <span className="capitalize font-medium text-sm">
                    {t('expenses.categories.' + item.category, {
                      defaultValue: item.category,
                    })}
                  </span>
                  <span className="font-bold text-destructive">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              {report.expenses.byCategory.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No expense data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
