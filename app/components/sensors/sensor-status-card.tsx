import { Link } from '@tanstack/react-router'
import { Activity, AlertTriangle, Radio } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface SensorStatusCardProps {
  totalSensors: number
  activeSensors: number
  inactiveSensors: number
  alertCount: number
}

export function SensorStatusCard({
  totalSensors,
  activeSensors,
  inactiveSensors,
  alertCount,
}: SensorStatusCardProps) {
  if (totalSensors === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Radio className="h-4 w-4" />
          Sensors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-green-500" />
                {activeSensors} online
              </span>
              {inactiveSensors > 0 && (
                <span className="text-muted-foreground">
                  {inactiveSensors} offline
                </span>
              )}
            </div>
            {alertCount > 0 && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertTriangle className="h-3 w-3" />
                {alertCount} alert{alertCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <Link
            to={'/sensors' as any}
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
