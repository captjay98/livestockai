import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getBatchesForFarm, getInventorySummary } from '~/lib/batches/server'
import { getFarmsForUser } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
import { formatNaira } from '~/lib/currency'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/components/ui/select'
import { FarmSelector } from '~/components/farm-selector'
import { Plus, Users, TrendingUp, AlertTriangle, Fish, Bird } from 'lucide-react'
import { useState } from 'react'

interface Batch {
  id: string
  farmId: string
  livestockType: 'poultry' | 'fish'
  species: string
  initialQuantity: number
  currentQuantity: number
  acquisitionDate: Date
  costPerUnit: string
  totalCost: string
  status: 'active' | 'depleted' | 'sold'
  createdAt: Date
  updatedAt: Date
}

interface InventorySummary {
  poultry: { batches: number; quantity: number; investment: number }
  fish: { batches: number; quantity: number; investment: number }
  overall: { 
    totalBatches: number
    activeBatches: number
    depletedBatches: number
    totalQuantity: number
    totalInvestment: number 
  }
}

interface Farm {
  id: string
  name: string
  type: string
}

interface BatchData {
  farms: Farm[]
  batches: Batch[]
  summary: InventorySummary | null
}

// Server function to get farms list
const getFarms = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const session = await requireAuth()
    const farms = await getFarmsForUser(session.user.id)
    return { farms, batches: [], summary: null }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      throw redirect({ to: '/login' })
    }
    throw error
  }
})

// Server function to get batch data for a specific farm
const getBatchesForFarmFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()

      const [batches, summary] = await Promise.all([
        getBatchesForFarm(session.user.id, data.farmId),
        getInventorySummary(session.user.id, data.farmId),
      ])

      return { batches, summary, farms: [] as Farm[] }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface BatchSearchParams {
  farmId?: string
  status?: 'active' | 'depleted' | 'sold'
  livestockType?: 'poultry' | 'fish'
}

export const Route = createFileRoute('/batches')({
  component: BatchesPage,
  validateSearch: (search: Record<string, unknown>): BatchSearchParams => ({
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
    status: typeof search.status === 'string' && ['active', 'depleted', 'sold'].includes(search.status) 
      ? search.status as 'active' | 'depleted' | 'sold' 
      : undefined,
    livestockType: typeof search.livestockType === 'string' && ['poultry', 'fish'].includes(search.livestockType)
      ? search.livestockType as 'poultry' | 'fish'
      : undefined,
  }),
  loaderDeps: ({ search }) => ({ farmId: search.farmId }),
  loader: async ({ deps }) => {
    if (deps.farmId) {
      return getBatchesForFarmFn({ data: { farmId: deps.farmId } })
    }
    return getFarms()
  },
})

function BatchesPage() {
  const { batches, summary, farms } = Route.useLoaderData() as BatchData
  const search = Route.useSearch()
  const [selectedFarm, setSelectedFarm] = useState(search.farmId || '')

  const handleFarmChange = (farmId: string) => {
    setSelectedFarm(farmId)
    window.history.pushState({}, '', `/batches?farmId=${farmId}`)
    window.location.reload()
  }

  if (!selectedFarm && farms.length > 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Livestock Inventory</h1>
            <p className="text-muted-foreground mt-1">
              Manage your livestock batches and inventory
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a farm</h3>
            <p className="text-muted-foreground mb-4">
              Choose a farm to view and manage its livestock inventory
            </p>
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
          <h1 className="text-3xl font-bold">Livestock Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage your livestock batches and inventory
          </p>
        </div>
        <div className="flex gap-3">
          <FarmSelector selectedFarmId={selectedFarm} onFarmChange={handleFarmChange} />
          <Link to="/batches/new" search={{ farmId: selectedFarm }}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Batch
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Livestock</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.overall.totalQuantity.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {summary.overall.activeBatches} active batches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Poultry</CardTitle>
              <Bird className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.poultry.quantity.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {summary.poultry.batches} batches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fish</CardTitle>
              <Fish className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.fish.quantity.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {summary.fish.batches} batches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(summary.overall.totalInvestment)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.overall.depletedBatches} depleted batches
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select
          value={search.status || 'all'}
          onValueChange={(value) => {
            const params = new URLSearchParams()
            if (selectedFarm) params.set('farmId', selectedFarm)
            if (value && value !== 'all') params.set('status', value)
            if (search.livestockType) params.set('livestockType', search.livestockType)
            window.history.pushState({}, '', `/batches?${params.toString()}`)
            window.location.reload()
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue>
              {search.status ? search.status.charAt(0).toUpperCase() + search.status.slice(1) : 'All Status'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="depleted">Depleted</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={search.livestockType || 'all'}
          onValueChange={(value) => {
            const params = new URLSearchParams()
            if (selectedFarm) params.set('farmId', selectedFarm)
            if (search.status) params.set('status', search.status)
            if (value && value !== 'all') params.set('livestockType', value)
            window.history.pushState({}, '', `/batches?${params.toString()}`)
            window.location.reload()
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue>
              {search.livestockType ? search.livestockType.charAt(0).toUpperCase() + search.livestockType.slice(1) : 'All Types'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="poultry">Poultry</SelectItem>
            <SelectItem value="fish">Fish</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Batches List */}
      {batches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No batches found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first livestock batch
            </p>
            <Link to="/batches/new" search={{ farmId: selectedFarm }}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Batch
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Card key={batch.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg capitalize">{batch.species}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      {batch.livestockType === 'poultry' ? (
                        <Bird className="h-4 w-4" />
                      ) : (
                        <Fish className="h-4 w-4" />
                      )}
                      {batch.livestockType}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant={
                      batch.status === 'active' ? 'default' :
                      batch.status === 'depleted' ? 'destructive' : 'secondary'
                    }>
                      {batch.status}
                    </Badge>
                    {batch.currentQuantity <= batch.initialQuantity * 0.1 && batch.status === 'active' && (
                      <Badge variant="warning" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Low Stock
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Quantity:</span>
                    <span className="font-medium">{batch.currentQuantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Initial Quantity:</span>
                    <span>{batch.initialQuantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost per Unit:</span>
                    <span>{formatNaira(batch.costPerUnit)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Acquisition Date:</span>
                    <span>{new Date(batch.acquisitionDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button variant="default" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
