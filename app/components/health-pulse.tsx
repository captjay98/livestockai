import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '~/lib/utils'
import { Card, CardContent } from '~/components/ui/card'

export type HealthStatus = 'healthy' | 'attention' | 'critical'

interface HealthPulseProps {
  status: HealthStatus
  title?: string
  metrics?: Array<{
    label: string
    value: string | number
    unit?: string
  }>
  message?: string
  className?: string
}

const statusConfig = {
  healthy: {
    icon: CheckCircle,
    label: 'On Track',
    borderColor: 'border-l-success',
    iconColor: 'text-success',
    bgColor: 'bg-success/5',
  },
  attention: {
    icon: AlertTriangle,
    label: 'Needs Attention',
    borderColor: 'border-l-warning',
    iconColor: 'text-warning',
    bgColor: 'bg-warning/5',
  },
  critical: {
    icon: XCircle,
    label: 'Critical',
    borderColor: 'border-l-destructive',
    iconColor: 'text-destructive',
    bgColor: 'bg-destructive/5',
  },
}

export function HealthPulse({
  status,
  title,
  metrics,
  message,
  className,
}: HealthPulseProps) {
  const { t } = useTranslation('common')
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Card
      className={cn(
        'border-l-4',
        config.borderColor,
        config.bgColor,
        className,
      )}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconColor)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('font-semibold', config.iconColor)}>
                {title || t(`health.${status}`, { defaultValue: config.label })}
              </span>
            </div>

            {metrics && metrics.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                {metrics.map((metric, index) => (
                  <span key={index} className="flex items-center gap-1">
                    {index > 0 && <span>•</span>}
                    <span>
                      {metric.label}: {metric.value}
                      {metric.unit}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {message && (
              <p className="text-sm text-muted-foreground mt-1">{message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
