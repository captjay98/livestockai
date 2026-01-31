import { Link } from '@tanstack/react-router'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BatchAlert } from '~/features/monitoring/server'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface BatchAlertsProps {
  alerts: Array<BatchAlert>
}

export function BatchAlerts({ alerts }: BatchAlertsProps) {
  const { t } = useTranslation(['common', 'mortality'])

  if (alerts.length === 0) return null

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          {t('mortality:alerts.title', { defaultValue: 'Alerts' })} ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {alerts.map((alert, i) => (
            <Link
              key={i}
              to="/batches"
              className={`flex items-center justify-between px-2 py-1.5 rounded text-xs border group hover:shadow-sm transition-all ${
                alert.type === 'critical'
                  ? 'border-destructive/30 hover:bg-destructive/5'
                  : 'border-warning/30 hover:bg-warning/5'
              }`}
            >
              <span className="truncate">
                <span className="font-semibold">{alert.species}:</span> {alert.message}
              </span>
              <ChevronRight className="h-3 w-3 flex-shrink-0 ml-1 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
