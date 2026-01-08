import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getVaccinationsForFarm, getTreatmentsForFarm, getVaccinationAlerts } from '~/lib/vaccinations/server'
import { getFarmsForUser } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { FarmSelector } from '~/components/farm-selector'
import { Plus, Syringe, Pill, AlertTriangle, Calendar } from 'lucide-react'
import { useState } from 'react'

interface Farm {
  id: string
  name: string
  type: string
}

interface Vaccination {
  id: string
  batchId: string
  vaccineName: string
  dateAdministered: Date
  dosage: string
  nextDueDate: Date | null
  species: string
}

interface Treatment {
  id: string
  batchId: string
  medicationName: string
  reason: string
  date: Date
  dosage: string
  withdrawalDays: number
  species: string
}

interface VaccinationData {
  farms: Farm[]
  vaccinations: Vaccination[]
  treatments: Treatment[]
  alerts: {
    upcoming: any[]
    overdue: any[]
    totalAlerts: number
  } | null
}

const getFarms = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const session = await requireAuth()
    const farms = await getFarmsForUser(session.user.id)
    return { farms, vaccinations: [], treatments: [], alerts: null }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      throw redirect({ to: '/login' })
    }
    throw error
  }
})

const getVaccinationDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [vaccinations, treatments, alerts] = await Promise.all([
        getVaccinationsForFarm(session.user.id, data.farmId),
        getTreatmentsForFarm(session.user.id, data.farmId),
        getVaccinationAlerts(session.user.id, data.farmId),
      ])
      return { vaccinations, treatments, alerts, farms: [] as Farm[] }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface VaccinationSearchParams {
  farmId?: string
}

export const Route = createFileRoute('/vaccinations')({
  component: VaccinationsPage,
  validateSearch: (search: Record<string, unknown>): VaccinationSearchParams => ({
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }),
  loaderDeps: ({ search }) => ({ farmId: search.farmId }),
  loader: async ({ deps }) => {
    if (deps.farmId) {
      return getVaccinationDataForFarm({ data: { farmId: deps.farmId } })
    }
    return getFarms()
  },
})

function VaccinationsPage() {
  const { vaccinations, treatments, alerts, farms } = Route.useLoaderData() as VaccinationData
  const search = Route.useSearch()
  const [selectedFarm, setSelectedFarm] = useState(search.farmId || '')

  const handleFarmChange = (farmId: string) => {
    setSelectedFarm(farmId)
    window.history.pushState({}, '', `/vaccinations?farmId=${farmId}`)
    window.location.reload()
  }

  if (!selectedFarm && farms.length > 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Health Management</h1>
            <p className="text-muted-foreground mt-1">Track vaccinations and treatments</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Syringe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a farm</h3>
            <p className="text-muted-foreground mb-4">Choose a farm to view health records</p>
            <FarmSelector onFarmChange={handleFarmChange} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Health Management</h1>
          <p className="text-muted-foreground mt-1">Track vaccinations and treatments</p>
        </div>
        <div className="flex gap-3">
          <FarmSelector selectedFarmId={selectedFarm} onFarmChange={handleFarmChange} />
          <Link to="/vaccinations/new" search={{ farmId: selectedFarm }}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {alerts && alerts.totalAlerts > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Vaccination Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.overdue.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-md border border-destructive/20">
                  <div>
                    <p className="font-medium text-destructive">{alert.vaccineName}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.species} - Due: {new Date(alert.nextDueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="destructive">Overdue</Badge>
                </div>
              ))}
              {alerts.upcoming.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-warning/10 rounded-md border border-warning/20">
                  <div>
                    <p className="font-medium text-warning">{alert.vaccineName}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.species} - Due: {new Date(alert.nextDueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="warning">Upcoming</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vaccinations</CardTitle>
            <Syringe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vaccinations.length}</div>
            <p className="text-xs text-muted-foreground">Total records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatments</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treatments.length}</div>
            <p className="text-xs text-muted-foreground">Total records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts?.totalAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {alerts?.overdue.length || 0} overdue, {alerts?.upcoming.length || 0} upcoming
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vaccinations List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            Vaccination History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vaccinations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No vaccination records</p>
          ) : (
            <div className="space-y-4">
              {vaccinations.map((vax) => (
                <div key={vax.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Syringe className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{vax.vaccineName}</p>
                      <p className="text-sm text-muted-foreground">
                        {vax.species} • {vax.dosage}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{new Date(vax.dateAdministered).toLocaleDateString()}</p>
                    {vax.nextDueDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Next: {new Date(vax.nextDueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treatments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Treatment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {treatments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No treatment records</p>
          ) : (
            <div className="space-y-4">
              {treatments.map((treatment) => (
                <div key={treatment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Pill className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{treatment.medicationName}</p>
                      <p className="text-sm text-muted-foreground">
                        {treatment.species} • {treatment.reason}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{new Date(treatment.date).toLocaleDateString()}</p>
                    <Badge variant="outline" className="text-xs">
                      {treatment.withdrawalDays} day withdrawal
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}