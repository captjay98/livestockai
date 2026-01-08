import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getWeightSamplesForFarm, getGrowthAlerts } from '~/lib/weight/server'
import { getFarmsForUser } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { FarmSelector } from '~/components/farm-selector'
import { Plus, Scale, TrendingUp, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface Farm {
  id: string
  name: string
  type: string
}

interface WeightSample {
  id: string
  batchId: string
  date: Date
  sampleSize: number
  averageWeightKg: string
  species: string
  livestockType: string
}

interface GrowthAlert {
  batchId: string
  species: string
  message: string
  severity: 'warning' | 'critical'
  adg: number
  expectedAdg: number
}

interface WeightData {
  farms: Farm[]
  samples: WeightSample[]
  alerts: GrowthAlert[]
}

const getFarms = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const session = await requireAuth()
    const farms = await getFarmsForUser(session.user.id)
    return { farms, samples: [], alerts: [] }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      throw redirect({ to: '/login' })
    }
    throw error
  }
})

const getWeightDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [samples, alerts] = await Promise.all([
        getWeightSamplesForFarm(session.user.id, data.farmId),
        getGrowthAlerts(session.user.id, data.farmId),
      ])
      return { samples, alerts, farms: [] as Farm[] }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface WeightSearchParams {
  farmId?: string
}

export const Route = createFileRoute('/weight')({
  component: WeightPage,
  validateSearch: (search: Record<string, unknown>): WeightSearchParams => ({
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }),
  loaderDeps: ({ search }) => ({ farmId: search.farmId }),
  loader: async ({ deps }) => {
    if (deps.farmId) {
      return getWeightDataForFarm({ data: { farmId: deps.farmId } })
    }
    return getFarms()
  },
})

function WeightPage() {
  const { samples, alerts, farms } = Route.useLoaderData() as WeightData
  const search = Route.useSearch()
  const [selectedFarm, setSelectedFarm] = useState(search.farmId || '')

  const handleFarmChange = (farmId: string) => {
    setSelectedFarm(farmId)
    window.history.pushState({}, '', `/weight?farmId=${farmId}`)
    window.location.reload()
  }

  if (!selectedFarm && farms.length > 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Weight Tracking</h1>
            <p className="text-muted-foreground mt-1">Monitor livestock growth and weight</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a farm</h3>
            <p className="text-muted-foreground mb-4">Choose a farm to view weight records</p>
            <FarmSelector onFarmChange={handleFarmChange} />
          </CardContent>
        </Card>
      </div>
    )
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical')
  const warningAlerts = alerts.filter(a => a.severity === 'warning')

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Weight Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor livestock growth and weight</p>
        </div>
        <div className="flex gap-3">
          <FarmSelector selectedFarmId={selectedFarm} onFarmChange={handleFarmChange} />
          <Link to="/weight/new" search={{ farmId: selectedFarm }}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Weight
            </Button>
          </Link>
        </div>
      </div>

      {/* Growth Alerts */}
      {alerts.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Growth Alerts
            </CardTitle>
            <CardDescription>Batches with below-expected growth rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert) => (
                <div key={alert.batchId} className="flex items-center justify-between p-3 bg-destructive/10 rounded-md border border-destructive/20">
                  <div>
                    <p className="font-medium text-destructive capitalize">{alert.species}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <Badge variant="destructive">Critical</Badge>
                </div>
              ))}
              {warningAlerts.map((alert) => (
                <div key={alert.batchId} className="flex items-center justify-between p-3 bg-warning/10 rounded-md border border-warning/20">
                  <div>
                    <p className="font-medium text-warning capitalize">{alert.species}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <Badge variant="warning">Warning</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{samples.length}</div>
            <p className="text-xs text-muted-foreground">Weight records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts.length} critical, {warningAlerts.length} warning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Weight</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {samples.length > 0 
                ? `${parseFloat(samples[0].averageWeightKg).toFixed(2)} kg`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {samples.length > 0 ? samples[0].species : 'No samples'}
            </p>
          </CardContent>
        </Card>
      </div>

      {samples.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No weight records</h3>
            <p className="text-muted-foreground mb-4">Start tracking livestock weight</p>
            <Link to="/weight/new" search={{ farmId: selectedFarm }}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Weight
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Weight Samples</CardTitle>
            <CardDescription>Recent weight measurements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {samples.map((sample) => (
                <div key={sample.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Scale className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium capitalize">{sample.species}</p>
                      <p className="text-sm text-muted-foreground">
                        Sample size: {sample.sampleSize} {sample.livestockType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-lg">{parseFloat(sample.averageWeightKg).toFixed(2)} kg</p>
                    <p className="text-sm text-muted-foreground">Average weight</p>
                  </div>
                  <Badge variant="outline">
                    {new Date(sample.date).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}