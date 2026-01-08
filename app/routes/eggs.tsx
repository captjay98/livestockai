import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getEggRecordsForFarm, getEggSummaryForFarm } from '~/lib/eggs/server'
import { getFarmsForUser } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { FarmSelector } from '~/components/farm-selector'
import { Plus, Egg, Package, TrendingUp, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface Farm {
  id: string
  name: string
  type: string
}

interface EggRecord {
  id: string
  batchId: string
  date: Date
  quantityCollected: number
  quantityBroken: number
  quantitySold: number
  species: string
  currentQuantity: number
}

interface EggData {
  farms: Farm[]
  records: EggRecord[]
  summary: {
    totalCollected: number
    totalBroken: number
    totalSold: number
    currentInventory: number
    recordCount: number
  } | null
}

const getFarms = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const session = await requireAuth()
    const farms = await getFarmsForUser(session.user.id)
    return { farms, records: [], summary: null }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      throw redirect({ to: '/login' })
    }
    throw error
  }
})

const getEggDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [records, summary] = await Promise.all([
        getEggRecordsForFarm(session.user.id, data.farmId),
        getEggSummaryForFarm(session.user.id, data.farmId),
      ])
      return { records, summary, farms: [] as Farm[] }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface EggSearchParams {
  farmId?: string
}

export const Route = createFileRoute('/eggs')({
  component: EggsPage,
  validateSearch: (search: Record<string, unknown>): EggSearchParams => ({
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }),
  loaderDeps: ({ search }) => ({ farmId: search.farmId }),
  loader: async ({ deps }) => {
    if (deps.farmId) {
      return getEggDataForFarm({ data: { farmId: deps.farmId } })
    }
    return getFarms()
  },
})

function EggsPage() {
  const { records, summary, farms } = Route.useLoaderData() as EggData
  const search = Route.useSearch()
  const [selectedFarm, setSelectedFarm] = useState(search.farmId || '')

  const handleFarmChange = (farmId: string) => {
    setSelectedFarm(farmId)
    window.history.pushState({}, '', `/eggs?farmId=${farmId}`)
    window.location.reload()
  }

  if (!selectedFarm && farms.length > 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Egg Production</h1>
            <p className="text-muted-foreground mt-1">Track daily egg collection and sales</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Egg className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a farm</h3>
            <p className="text-muted-foreground mb-4">Choose a farm to view egg production</p>
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
          <h1 className="text-3xl font-bold">Egg Production</h1>
          <p className="text-muted-foreground mt-1">Track daily egg collection and sales</p>
        </div>
        <div className="flex gap-3">
          <FarmSelector selectedFarmId={selectedFarm} onFarmChange={handleFarmChange} />
          <Link to="/eggs/new" search={{ farmId: selectedFarm }}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Eggs
            </Button>
          </Link>
        </div>
      </div>

      {summary && (
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <Egg className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalCollected.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{summary.recordCount} records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sold</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalSold.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Eggs sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Broken/Lost</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalBroken.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalCollected > 0 
                  ? `${((summary.totalBroken / summary.totalCollected) * 100).toFixed(1)}% loss rate`
                  : '0% loss rate'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Inventory</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.currentInventory.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Eggs in stock</p>
            </CardContent>
          </Card>
        </div>
      )}

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Egg className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No egg records</h3>
            <p className="text-muted-foreground mb-4">Start tracking egg production</p>
            <Link to="/eggs/new" search={{ farmId: selectedFarm }}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Eggs
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Production Records</CardTitle>
            <CardDescription>Daily egg collection records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {records.map((record) => {
                const layingPct = record.currentQuantity > 0 
                  ? ((record.quantityCollected / record.currentQuantity) * 100).toFixed(1)
                  : '0'
                return (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Egg className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium capitalize">{record.species}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.currentQuantity} birds • {layingPct}% laying
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-green-600">+{record.quantityCollected}</p>
                        <p className="text-muted-foreground">Collected</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-blue-600">-{record.quantitySold}</p>
                        <p className="text-muted-foreground">Sold</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-red-600">-{record.quantityBroken}</p>
                        <p className="text-muted-foreground">Broken</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {new Date(record.date).toLocaleDateString()}
                    </Badge>
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
