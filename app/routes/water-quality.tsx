import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getWaterQualityForFarm, getWaterQualityAlerts } from '~/lib/water-quality/server'
import { WATER_QUALITY_THRESHOLDS } from '~/lib/water-quality/constants'
import { getFarmsForUser } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { FarmSelector } from '~/components/farm-selector'
import { Plus, Droplets, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface Farm {
  id: string
  name: string
  type: string
}

interface WaterQualityRecord {
  id: string
  batchId: string
  date: Date
  ph: string
  temperatureCelsius: string
  dissolvedOxygenMgL: string
  ammoniaMgL: string
  species: string
}

interface WaterQualityAlert {
  batchId: string
  species: string
  issues: string[]
  severity: 'warning' | 'critical'
}

interface WaterQualityData {
  farms: Farm[]
  records: WaterQualityRecord[]
  alerts: WaterQualityAlert[]
}

const getFarms = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const session = await requireAuth()
    const farms = await getFarmsForUser(session.user.id)
    return { farms, records: [], alerts: [] }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      throw redirect({ to: '/login' })
    }
    throw error
  }
})

const getWaterQualityDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [records, alerts] = await Promise.all([
        getWaterQualityForFarm(session.user.id, data.farmId),
        getWaterQualityAlerts(session.user.id, data.farmId),
      ])
      return { records, alerts, farms: [] as Farm[] }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface WaterQualitySearchParams {
  farmId?: string
}

export const Route = createFileRoute('/water-quality')({
  component: WaterQualityPage,
  validateSearch: (search: Record<string, unknown>): WaterQualitySearchParams => ({
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }),
  loaderDeps: ({ search }) => ({ farmId: search.farmId }),
  loader: async ({ deps }) => {
    if (deps.farmId) {
      return getWaterQualityDataForFarm({ data: { farmId: deps.farmId } })
    }
    return getFarms()
  },
})

function WaterQualityPage() {
  const { records, alerts, farms } = Route.useLoaderData() as WaterQualityData
  const search = Route.useSearch()
  const [selectedFarm, setSelectedFarm] = useState(search.farmId || '')

  const handleFarmChange = (farmId: string) => {
    setSelectedFarm(farmId)
    window.history.pushState({}, '', `/water-quality?farmId=${farmId}`)
    window.location.reload()
  }

  if (!selectedFarm && farms.length > 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Water Quality</h1>
            <p className="text-muted-foreground mt-1">Monitor pond water parameters</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Droplets className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a farm</h3>
            <p className="text-muted-foreground mb-4">Choose a farm to view water quality</p>
            <FarmSelector onFarmChange={handleFarmChange} />
          </CardContent>
        </Card>
      </div>
    )
  }

  const t = WATER_QUALITY_THRESHOLDS

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Water Quality</h1>
          <p className="text-muted-foreground mt-1">Monitor pond water parameters</p>
        </div>
        <div className="flex gap-3">
          <FarmSelector selectedFarmId={selectedFarm} onFarmChange={handleFarmChange} />
          <Link to="/water-quality/new" search={{ farmId: selectedFarm }}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Reading
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Water Quality Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.batchId} 
                  className={`p-3 rounded-md border ${
                    alert.severity === 'critical' 
                      ? 'bg-destructive/10 border-destructive/20' 
                      : 'bg-warning/10 border-warning/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className={`font-medium ${alert.severity === 'critical' ? 'text-destructive' : 'text-warning'}`}>
                      {alert.species}
                    </p>
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'warning'}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {alert.issues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safe Ranges Reference */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Safe Ranges</CardTitle>
          <CardDescription>Optimal water quality parameters for fish</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">pH Level</p>
              <p className="text-lg">{t.ph.min} - {t.ph.max}</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Temperature</p>
              <p className="text-lg">{t.temperature.min}°C - {t.temperature.max}°C</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Dissolved Oxygen</p>
              <p className="text-lg">&gt; {t.dissolvedOxygen.min} mg/L</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Ammonia</p>
              <p className="text-lg">&lt; {t.ammonia.max} mg/L</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records */}
      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Droplets className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No water quality records</h3>
            <p className="text-muted-foreground mb-4">Start monitoring your pond water</p>
            <Link to="/water-quality/new" search={{ farmId: selectedFarm }}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Reading
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Water Quality Records</CardTitle>
            <CardDescription>Recent water quality measurements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {records.map((record) => {
                const ph = parseFloat(record.ph)
                const temp = parseFloat(record.temperatureCelsius)
                const oxygen = parseFloat(record.dissolvedOxygenMgL)
                const ammonia = parseFloat(record.ammoniaMgL)
                
                const hasIssue = 
                  ph < t.ph.min || ph > t.ph.max ||
                  temp < t.temperature.min || temp > t.temperature.max ||
                  oxygen < t.dissolvedOxygen.min ||
                  ammonia > t.ammonia.max

                return (
                  <div key={record.id} className={`p-4 border rounded-lg ${hasIssue ? 'border-warning' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium capitalize">{record.species}</span>
                      </div>
                      <Badge variant="outline">
                        {new Date(record.date).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">pH</p>
                        <p className={`font-medium ${ph < t.ph.min || ph > t.ph.max ? 'text-warning' : ''}`}>
                          {ph.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Temp</p>
                        <p className={`font-medium ${temp < t.temperature.min || temp > t.temperature.max ? 'text-warning' : ''}`}>
                          {temp.toFixed(1)}°C
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">DO</p>
                        <p className={`font-medium ${oxygen < t.dissolvedOxygen.min ? 'text-warning' : ''}`}>
                          {oxygen.toFixed(1)} mg/L
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ammonia</p>
                        <p className={`font-medium ${ammonia > t.ammonia.max ? 'text-warning' : ''}`}>
                          {ammonia.toFixed(3)} mg/L
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}