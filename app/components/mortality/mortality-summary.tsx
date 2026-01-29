import { HeartPulse, Skull, TrendingDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface MortalitySummaryProps {
  summary: {
    totalDeaths: number
    recordCount: number
    criticalAlerts: number
    totalAlerts: number
  }
}

export function MortalitySummary({ summary }: MortalitySummaryProps) {
  const { t } = useTranslation(['mortality', 'common'])

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 mb-6 md:mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('mortality:totalDeaths', {
              defaultValue: 'Total Deaths',
            })}
          </CardTitle>
          <Skull className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold text-destructive">
            {summary.totalDeaths.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('mortality:healthAlerts', {
              defaultValue: 'Health Alerts',
            })}
          </CardTitle>
          <HeartPulse className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold text-orange-600">
            {summary.criticalAlerts}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              {t('common:critical', { defaultValue: 'Critical' })}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {t('mortality:totalAlerts', {
              count: summary.totalAlerts,
              defaultValue: '{{count}} total alerts',
            })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2 sm:pb-1 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('common:records', { defaultValue: 'Records' })}
          </CardTitle>
          <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
          <div className="text-lg sm:text-2xl font-bold">
            {summary.recordCount}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {t('mortality:recordedIncidents', {
              defaultValue: 'Recorded incidents',
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
