import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, MapPin, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/_auth/extension/alerts')({
  component: ExtensionAlertsPage,
})

// Mock data - replace with actual server function
const mockAlerts = [
  {
    id: '1',
    severity: 'critical' as const,
    species: 'poultry',
    title: 'Avian Flu Outbreak',
    description: 'Confirmed cases in 3 farms within district',
    affectedFarmCount: 3,
    districtName: 'Kaduna North',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    severity: 'warning' as const,
    species: 'fish',
    title: 'Water Quality Alert',
    description: 'pH levels below optimal range detected',
    affectedFarmCount: 1,
    districtName: 'Kaduna South',
    createdAt: new Date('2024-01-14'),
  },
]

function ExtensionAlertsPage() {
  const { t } = useTranslation(['common'])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'warning':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getSpeciesIcon = (species: string) => {
    switch (species) {
      case 'poultry':
        return '🐔'
      case 'fish':
        return '🐟'
      case 'cattle':
        return '🐄'
      default:
        return '🐾'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-8 w-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-bold">
            {t('outbreakAlerts', {
              defaultValue: 'Outbreak Alerts',
            })}
          </h1>
          <p className="text-muted-foreground">
            Active health alerts for your assigned districts
          </p>
        </div>
      </div>

      {mockAlerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
            <p className="text-muted-foreground text-center">
              All farms in your districts are currently healthy
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {mockAlerts.map((alert) => (
            <Card key={alert.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getSpeciesIcon(alert.species)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {alert.districtName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={getSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground mb-4">
                  {alert.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {alert.affectedFarmCount} farm
                      {alert.affectedFarmCount !== 1 ? 's' : ''} affected
                    </span>
                  </div>
                  <Link
                    to="/extension/alerts/$alertId"
                    params={{ alertId: alert.id }}
                  >
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
