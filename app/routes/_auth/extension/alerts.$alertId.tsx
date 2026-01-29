import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Calendar, MapPin, Save, Users } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  getOutbreakAlertFn,
  updateOutbreakAlertFn,
} from '~/features/extension/server'
import { useErrorMessage } from '~/hooks/useErrorMessage'

export const Route = createFileRoute('/_auth/extension/alerts/$alertId')({
  loader: async ({ params }) => {
    return getOutbreakAlertFn({ data: { alertId: params.alertId } })
  },
  component: AlertDetailPage,
})

function AlertDetailPage() {
  const getErrorMessage = useErrorMessage()
  const alert = Route.useLoaderData()
  const [status, setStatus] = useState(alert.status)
  const [notes, setNotes] = useState(alert.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await updateOutbreakAlertFn({
        data: {
          alertId: alert.id,
          status: status !== alert.status ? status : undefined,
          notes: notes !== alert.notes ? notes : undefined,
        },
      })
      toast.success('Alert updated successfully')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'alert':
        return 'secondary'
      case 'watch':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'active':
        return 'destructive'
      case 'monitoring':
        return 'secondary'
      case 'resolved':
        return 'default'
      case 'false_positive':
        return 'outline'
      default:
        return 'default'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-8 w-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-bold">Alert Details</h1>
          <p className="text-muted-foreground">
            {alert.livestockType} outbreak in district
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Alert Information
              <div className="flex gap-2">
                <Badge variant={getSeverityColor(alert.severity)}>
                  {alert.severity}
                </Badge>
                <Badge variant={getStatusColor(alert.status)}>
                  {alert.status}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Detected: {new Date(alert.detectedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Species: {alert.livestockType}</span>
            </div>
            {alert.resolvedAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Resolved: {new Date(alert.resolvedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Affected Farms ({alert.farms.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alert.farms.length > 0 ? (
              <div className="space-y-3">
                {alert.farms.map((farm: any) => (
                  <div
                    key={farm.farmId}
                    className="flex justify-between items-center p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{farm.farmName}</p>
                      <p className="text-sm text-muted-foreground">
                        Reported:{' '}
                        {new Date(farm.reportedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {Number(farm.mortalityRate).toFixed(1)}% mortality
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No farms affected</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Alert</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this alert..."
              rows={4}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
