import { useTranslation } from 'react-i18next'
import { Bird, Egg, Fish, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface SalesSummaryData {
  poultry: { count: number; quantity: number; revenue: number }
  fish: { count: number; quantity: number; revenue: number }
  eggs: { count: number; quantity: number; revenue: number }
  total: { count: number; quantity: number; revenue: number }
}

interface SalesSummaryProps {
  summary: SalesSummaryData
  formatCurrency: (value: string | number) => string
}

export function SalesSummary({ summary, formatCurrency }: SalesSummaryProps) {
  const { t } = useTranslation(['sales'])

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-6 md:mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('summaries.totalRevenue')}
          </CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className="text-lg sm:text-2xl font-bold text-success">
            {formatCurrency(summary.total.revenue)}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {summary.total.count} {t('summaries.sales')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('livestockTypes.poultry')}
          </CardTitle>
          <Bird className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className="text-lg sm:text-2xl font-bold">
            {formatCurrency(summary.poultry.revenue)}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {summary.poultry.quantity} {t('summaries.units')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('livestockTypes.fish')}
          </CardTitle>
          <Fish className="h-3 w-3 sm:h-4 sm:w-4 text-info" />
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className="text-lg sm:text-2xl font-bold">
            {formatCurrency(summary.fish.revenue)}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {summary.fish.quantity} {t('summaries.units')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('livestockTypes.eggs')}
          </CardTitle>
          <Egg className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className="text-lg sm:text-2xl font-bold">
            {formatCurrency(summary.eggs.revenue)}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {summary.eggs.quantity} {t('summaries.units')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
