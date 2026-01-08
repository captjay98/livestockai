import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getFeedRecordsForFarm } from '~/lib/feed/server'
import { FEED_TYPES } from '~/lib/feed/constants'
import { getFarmsForUser } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
import { formatNaira } from '~/lib/currency'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { FarmSelector } from '~/components/farm-selector'
import { Plus, Wheat, TrendingUp, Package } from 'lucide-react'
import { useState } from 'react'

interface Farm {
  id: string
  name: string
  type: string
}

interface FeedRecord {
  id: string
  batchId: string
  feedType: string
  quantityKg: string
  cost: string
  date: Date
  species: string
  livestockType: string
}

interface FeedData {
  farms: Farm[]
  records: FeedRecord[]
  summary: {
    totalQuantityKg: number
    totalCost: number
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

const getFeedDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const records = await getFeedRecordsForFarm(session.user.id, data.farmId)
      
      const totalQuantityKg = records.reduce((sum, r) => sum + parseFloat(r.quantityKg), 0)
      const totalCost = records.reduce((sum, r) => sum + parseFloat(r.cost), 0)
      
      return { 
        records, 
        summary: { totalQuantityKg, totalCost, recordCount: records.length },
        farms: [] as Farm[]
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface FeedSearchParams {
  farmId?: string
}

export const Route = createFileRoute('/feed')({
  component: FeedPage,
  validateSearch: (search: Record<string, unknown>): FeedSearchParams => ({
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }),
  loaderDeps: ({ search }) => ({ farmId: search.farmId }),
  loader: async ({ deps }) => {
    if (deps.farmId) {
      return getFeedDataForFarm({ data: { farmId: deps.farmId } })
    }
    return getFarms()
  },
})

function FeedPage() {
  const { records, summary, farms } = Route.useLoaderData() as FeedData
  const search = Route.useSearch()
  const [selectedFarm, setSelectedFarm] = useState(search.farmId || '')

  const handleFarmChange = (farmId: string) => {
    setSelectedFarm(farmId)
    window.history.pushState({}, '', `/feed?farmId=${farmId}`)
    window.location.reload()
  }

  if (!selectedFarm && farms.length > 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Feed Management</h1>
            <p className="text-muted-foreground mt-1">Track feed consumption and costs</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Wheat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a farm</h3>
            <p className="text-muted-foreground mb-4">Choose a farm to view feed records</p>
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
          <h1 className="text-3xl font-bold">Feed Management</h1>
          <p className="text-muted-foreground mt-1">Track feed consumption and costs</p>
        </div>
        <div className="flex gap-3">
          <FarmSelector selectedFarmId={selectedFarm} onFarmChange={handleFarmChange} />
          <Link to="/feed/new" search={{ farmId: selectedFarm }}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Feed
            </Button>
          </Link>
        </div>
      </div>

      {summary && (
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feed Used</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalQuantityKg.toLocaleString()} kg</div>
              <p className="text-xs text-muted-foreground">{summary.recordCount} records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feed Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(summary.totalCost)}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cost per kg</CardTitle>
              <Wheat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalQuantityKg > 0 
                  ? formatNaira(summary.totalCost / summary.totalQuantityKg)
                  : '₦0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Per kilogram</p>
            </CardContent>
          </Card>
        </div>
      )}

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wheat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No feed records</h3>
            <p className="text-muted-foreground mb-4">Start tracking feed consumption</p>
            <Link to="/feed/new" search={{ farmId: selectedFarm }}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Feed
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Feed Records</CardTitle>
            <CardDescription>Recent feed consumption records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {records.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Wheat className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium capitalize">{record.species}</p>
                      <p className="text-sm text-muted-foreground">
                        {FEED_TYPES.find(t => t.value === record.feedType)?.label || record.feedType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{parseFloat(record.quantityKg).toLocaleString()} kg</p>
                    <p className="text-sm text-muted-foreground">{formatNaira(record.cost)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      {new Date(record.date).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
