import { TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

export interface GrowthAlert {
  batchId: string
  species: string
  message: string
  severity: 'warning' | 'critical'
  adg: number
  expectedAdg: number
}

interface GrowthAlertsProps {
  alerts: Array<GrowthAlert>
}

export function GrowthAlerts({ alerts }: GrowthAlertsProps) {
  const { t } = useTranslation(['weight'])

  if (alerts.length === 0) return null

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2">
      <Card className="border-primary/20 bg-primary/10 md:col-span-2">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium text-primary flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('weight:growthAlerts', { defaultValue: 'Growth Alerts' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 text-sm space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-card p-2 rounded border border-primary/20"
            >
              <span className="font-medium">{alert.species}</span>
              <span className="text-muted-foreground">{alert.message}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
