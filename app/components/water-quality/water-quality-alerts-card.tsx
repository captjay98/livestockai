import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface WaterQualityAlert {
  batchId: string
  species: string
  issues: Array<string>
  severity: 'warning' | 'critical'
}

interface WaterQualityAlertsCardProps {
  alerts: Array<WaterQualityAlert>
}

export function WaterQualityAlertsCard({
  alerts,
}: WaterQualityAlertsCardProps) {
  const { t } = useTranslation(['waterQuality'])

  if (alerts.length === 0) return null

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2">
      <Card className="border-destructive/20 bg-destructive/10 md:col-span-2">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium text-destructive flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t('waterQuality:qualityAlerts', {
              defaultValue: 'Quality Alerts',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 text-sm space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className="flex flex-col gap-1 bg-card p-2 rounded border border-destructive/20"
            >
              <span className="font-medium">{alert.species}</span>
              <ul className="list-disc list-inside text-xs text-muted-foreground">
                {alert.issues.map((issue, idx) => (
                  <li key={idx} className="text-destructive">
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
