import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getMortalityAlerts } from '~/lib/mortality/server'
import { getFarmsForUser } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { FarmSelector } from '~/components/farm-selector'
import { Plus, AlertTriangle, TrendingDown, Users } from 'lucide-react'
import { useState } from 'react'

interface Farm {
  id: string
  name: string
  type: string
}

interface Alert {
  type: 'high_mortality' | 'low_stock'
  batchId: string
  batchSpecies: string
  severity: 'critical' | 'warning'
  message: string
  quantity: number
  rate: number
}

interface MortalityData {
  farms: Farm[]
  alerts: Alert[]
}

// Server function to get farms list
const getFarms = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const session = await requireAuth()
    const farms = await getFarmsForUser(session.user.id)
    return { farms, alerts: [] }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      throw redirect({ to: '/login' })
    }
    throw error
  }
})

// Server function to get mortality data for a specific farm
const getMortalityForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const alerts = await getMortalityAlerts(session.user.id, data.farmId)
      return { alerts, farms: [] as Farm[] }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface MortalitySearchParams {
  farmId?: string
}

export const Route = createFileRoute('/mortality')({
  component: MortalityPage,
  validateSearch: (search: Record<string, unknown>): MortalitySearchParams => ({
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }),
  loaderDeps: ({ search }) => ({ farmId: search.farmId }),
  loader: async ({ deps }) => {
    if (deps.farmId) {
      return getMortalityForFarm({ data: { farmId: deps.farmId } })
    }
    return getFarms()
  },
})

function MortalityPage() {
  const { alerts, farms } = Route.useLoaderData() as MortalityData
  const search = Route.useSearch()
  const [selectedFarm, setSelectedFarm] = useState(search.farmId || '')

  const handleFarmChange = (farmId: string) => {
    setSelectedFarm(farmId)
    window.history.pushState({}, '', `/mortality?farmId=${farmId}`)
    window.location.reload()
  }

  if (!selectedFarm && farms.length > 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Mortality Tracking</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and record livestock mortality
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a farm</h3>
            <p className="text-muted-foreground mb-4">
              Choose a farm to view mortality tracking and alerts
            </p>
            <FarmSelector onFarmChange={handleFarmChange} />
          </CardContent>
        </Card>
      </div>
    )
  }

  const criticalAlerts = alerts.filter((alert: Alert) => alert.severity === 'critical')
  const warningAlerts = alerts.filter((alert: Alert) => alert.severity === 'warning')

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mortality Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and record livestock mortality
          </p>
        </div>
        <div className="flex gap-3">
          <FarmSelector selectedFarmId={selectedFarm} onFarmChange={handleFarmChange} />
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Record Mortality
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{warningAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Monitor closely
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Active monitoring alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No alerts</h3>
            <p className="text-muted-foreground mb-4">
              All batches are within normal mortality ranges
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Mortality
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Alerts</h2>
          
          {criticalAlerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Critical Alerts
              </h3>
              {criticalAlerts.map((alert: Alert, index: number) => (
                <Card key={`critical-${index}`} className="border-destructive">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg capitalize">{alert.batchSpecies}</CardTitle>
                        <CardDescription className="text-destructive">
                          {alert.message}
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">Critical</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {alert.type === 'high_mortality' ? 'Recent Deaths' : 'Remaining Stock'}: {alert.quantity.toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Batch
                        </Button>
                        <Button size="sm">
                          Record Mortality
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {warningAlerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-warning flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Warning Alerts
              </h3>
              {warningAlerts.map((alert: Alert, index: number) => (
                <Card key={`warning-${index}`} className="border-warning">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg capitalize">{alert.batchSpecies}</CardTitle>
                        <CardDescription className="text-warning">
                          {alert.message}
                        </CardDescription>
                      </div>
                      <Badge variant="warning">Warning</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {alert.type === 'high_mortality' ? 'Recent Deaths' : 'Remaining Stock'}: {alert.quantity.toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Batch
                        </Button>
                        <Button size="sm">
                          Record Mortality
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common mortality tracking tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <Plus className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Record Mortality</div>
                <div className="text-xs text-muted-foreground">
                  Add new mortality record
                </div>
              </div>
            </Button>

            <Link to="/batches" search={{ farmId: selectedFarm, status: 'active' }}>
              <Button variant="outline" className="h-auto p-4 w-full">
                <div className="text-center">
                  <Users className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">View Batches</div>
                  <div className="text-xs text-muted-foreground">
                    Monitor active batches
                  </div>
                </div>
              </Button>
            </Link>

            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <TrendingDown className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Mortality Report</div>
                <div className="text-xs text-muted-foreground">
                  Generate detailed reports
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
