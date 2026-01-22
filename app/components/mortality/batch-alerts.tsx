import { Link } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BatchAlert } from '~/features/monitoring/server'

interface BatchAlertsProps {
  alerts: Array<BatchAlert>
}

export function BatchAlerts({ alerts }: BatchAlertsProps) {
  const { t } = useTranslation(['common'])

  if (alerts.length === 0) return null

  return (
    <div className="mb-6 space-y-2">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`p-3 rounded-md border flex items-center justify-between ${
            alert.type === 'critical'
              ? 'bg-destructive/10 border-destructive/20'
              : 'bg-warning/10 border-warning/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`h-4 w-4 ${alert.type === 'critical' ? 'text-destructive' : 'text-warning'}`}
            />
            <span className="font-medium text-sm">
              {alert.species}: {alert.message}
            </span>
          </div>
          <Link to={`/batches`} className="text-xs underline">
            {t('common:view', { defaultValue: 'View' })}
          </Link>
        </div>
      ))}
    </div>
  )
}
