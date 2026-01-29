import type { SensorAlert } from '~/features/sensors/types'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'

interface AlertHistoryProps {
  alerts: Array<SensorAlert>
  onAcknowledge?: (alertId: string) => void
}

export function AlertHistory({ alerts, onAcknowledge }: AlertHistoryProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No alerts found
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map((alert) => (
          <TableRow key={alert.id}>
            <TableCell>{new Date(alert.createdAt).toLocaleString()}</TableCell>
            <TableCell>{alert.alertType}</TableCell>
            <TableCell>
              <Badge
                variant={
                  alert.severity === 'critical' ? 'destructive' : 'secondary'
                }
                className={
                  alert.severity === 'warning'
                    ? 'bg-yellow-100 text-yellow-800'
                    : ''
                }
              >
                {alert.severity}
              </Badge>
            </TableCell>
            <TableCell>{alert.triggerValue}</TableCell>
            <TableCell>{alert.message}</TableCell>
            <TableCell>
              {alert.acknowledged ? (
                <span className="text-muted-foreground">Acknowledged</span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAcknowledge?.(alert.id)}
                >
                  Acknowledge
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
