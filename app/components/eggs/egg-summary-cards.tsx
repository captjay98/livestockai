import { AlertTriangle, Egg, Package, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface EggSummary {
  totalCollected: number
  totalBroken: number
  totalSold: number
  currentInventory: number
  recordCount: number
}

interface EggSummaryCardsProps {
  summary: EggSummary | null
}

export function EggSummaryCards({ summary }: EggSummaryCardsProps) {
  const { t } = useTranslation(['eggs'])

  if (!summary) return null

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-4 mb-6 md:mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('eggs:totalCollected', {
              defaultValue: 'Total Collected',
            })}
          </CardTitle>
          <Egg className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold">
            {summary.totalCollected.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('eggs:brokenLoss', { defaultValue: 'Broken/Loss' })}
          </CardTitle>
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold text-destructive">
            {summary.totalBroken.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('eggs:totalSold', { defaultValue: 'Total Sold' })}
          </CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold text-green-600">
            {summary.totalSold.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('eggs:inInventory', {
              defaultValue: 'In Inventory',
            })}
          </CardTitle>
          <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold">
            {summary.currentInventory.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
