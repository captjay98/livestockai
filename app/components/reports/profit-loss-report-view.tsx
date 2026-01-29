import { useTranslation } from 'react-i18next'
import type { ProfitLossReport } from '~/features/reports/server'
import { useFormatCurrency } from '~/features/settings'

export function ProfitLossReportView({ report }: { report: ProfitLossReport }) {
  const { format: formatCurrency } = useFormatCurrency()
  const { t } = useTranslation(['reports', 'common'])
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
        <div className="p-3 sm:p-4 bg-success/10 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('profitLoss.totalRevenue', {
              defaultValue: 'Total Revenue',
            })}
          </div>
          <div className="text-lg sm:text-2xl font-bold text-success">
            {formatCurrency(report.revenue.total)}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-destructive/10 rounded-lg">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('profitLoss.totalExpenses', {
              defaultValue: 'Total Expenses',
            })}
          </div>
          <div className="text-lg sm:text-2xl font-bold text-destructive">
            {formatCurrency(report.expenses.total)}
          </div>
        </div>
        <div
          className={`p-3 sm:p-4 rounded-lg col-span-2 sm:col-span-1 ${report.profit >= 0 ? 'bg-info/10' : 'bg-warning/10'}`}
        >
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1">
            {t('profitLoss.netProfit', {
              defaultValue: 'Net Profit',
            })}
          </div>
          <div
            className={`text-lg sm:text-2xl font-bold ${report.profit >= 0 ? 'text-info' : 'text-warning'}`}
          >
            {formatCurrency(report.profit)}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">
            {report.profitMargin}%{' '}
            {t('profitLoss.margin', { defaultValue: 'margin' })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="font-medium mb-3">
            {t('profitLoss.revenueByType', {
              defaultValue: 'Revenue by Type',
            })}
          </h3>
          <div className="space-y-2">
            {report.revenue.byType.map((item) => (
              <div
                key={item.type}
                className="flex justify-between p-2 bg-muted/50 rounded"
              >
                <span className="capitalize">
                  {t(`common.livestock.${item.type}`, {
                    defaultValue: item.type,
                  })}
                </span>
                <span className="font-medium">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-3">
            {t('profitLoss.expensesByCategory', {
              defaultValue: 'Expenses by Category',
            })}
          </h3>
          <div className="space-y-2">
            {report.expenses.byCategory.map((item) => (
              <div
                key={item.category}
                className="flex justify-between p-2 bg-muted/50 rounded"
              >
                <span className="capitalize">
                  {t('expenses.categories.' + item.category, {
                    defaultValue: item.category,
                  })}
                </span>
                <span className="font-medium">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
