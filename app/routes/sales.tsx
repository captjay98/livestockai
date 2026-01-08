import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSalesForFarm, getSalesSummary } from '~/lib/sales/server'
import { getFarmsForUser } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
import { formatNaira } from '~/lib/currency'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { FarmSelector } from '~/components/farm-selector'
import { Plus, ShoppingCart, TrendingUp, Bird, Fish, Egg } from 'lucide-react'
import { useState } from 'react'

interface Farm {
  id: string
  name: string
  type: string
}

interface Sale {
  id: string
  livestockType: string
  quantity: number
  unitPrice: string
  totalAmount: string
  date: Date
  customerName: string | null
  batchSpecies: string | null
}

interface SalesSummary {
  poultry: { count: number; quantity: number; revenue: number }
  fish: { count: number; quantity: number; revenue: number }
  eggs: { count: number; quantity: number; revenue: number }
  total: { count: number; quantity: number; revenue: number }
}

interface SalesData {
  farms: Farm[]
  sales: Sale[]
  summary: SalesSummary | null
}

const getFarms = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const session = await requireAuth()
    const farms = await getFarmsForUser(session.user.id)
    return { farms, sales: [], summary: null }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      throw redirect({ to: '/login' })
    }
    throw error
  }
})

const getSalesDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [sales, summary] = await Promise.all([
        getSalesForFarm(session.user.id, data.farmId),
        getSalesSummary(session.user.id, data.farmId),
      ])
      return { sales, summary, farms: [] as Farm[] }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface SalesSearchParams {
  farmId?: string
}

export const Route = createFileRoute('/sales')({
  component: SalesPage,
  validateSearch: (search: Record<string, unknown>): SalesSearchParams => ({
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }),
  loaderDeps: ({ search }) => ({ farmId: search.farmId }),
  loader: async ({ deps }) => {
    if (deps.farmId) {
      return getSalesDataForFarm({ data: { farmId: deps.farmId } })
    }
    return getFarms()
  },
})

function SalesPage() {
  const { sales, summary, farms } = Route.useLoaderData() as SalesData
  const search = Route.useSearch()
  const [selectedFarm, setSelectedFarm] = useState(search.farmId || '')

  const handleFarmChange = (farmId: string) => {
    setSelectedFarm(farmId)
    window.history.pushState({}, '', `/sales?farmId=${farmId}`)
    window.location.reload()
  }

  if (!selectedFarm && farms.length > 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Sales</h1>
            <p className="text-muted-foreground mt-1">Track your sales and revenue</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a farm</h3>
            <p className="text-muted-foreground mb-4">Choose a farm to view sales</p>
            <FarmSelector onFarmChange={handleFarmChange} />
          </CardContent>
        </Card>
      </div>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'poultry': return <Bird className="h-4 w-4" />
      case 'fish': return <Fish className="h-4 w-4" />
      case 'eggs': return <Egg className="h-4 w-4" />
      default: return <ShoppingCart className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground mt-1">Track your sales and revenue</p>
        </div>
        <div className="flex gap-3">
          <FarmSelector selectedFarmId={selectedFarm} onFarmChange={handleFarmChange} />
          <Link to="/sales/new" search={{ farmId: selectedFarm }}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Sale
            </Button>
          </Link>
        </div>
      </div>

      {summary && (
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(summary.total.revenue)}</div>
              <p className="text-xs text-muted-foreground">{summary.total.count} sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Poultry Sales</CardTitle>
              <Bird className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(summary.poultry.revenue)}</div>
              <p className="text-xs text-muted-foreground">{summary.poultry.quantity} birds sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fish Sales</CardTitle>
              <Fish className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(summary.fish.revenue)}</div>
              <p className="text-xs text-muted-foreground">{summary.fish.quantity} fish sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Egg Sales</CardTitle>
              <Egg className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(summary.eggs.revenue)}</div>
              <p className="text-xs text-muted-foreground">{summary.eggs.quantity} eggs sold</p>
            </CardContent>
          </Card>
        </div>
      )}

      {sales.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sales yet</h3>
            <p className="text-muted-foreground mb-4">Record your first sale</p>
            <Link to="/sales/new" search={{ farmId: selectedFarm }}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Sale
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sales History</CardTitle>
            <CardDescription>Recent sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {getTypeIcon(sale.livestockType)}
                    </div>
                    <div>
                      <p className="font-medium capitalize">
                        {sale.batchSpecies || sale.livestockType}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sale.customerName || 'Walk-in customer'} • {sale.quantity} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatNaira(sale.totalAmount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNaira(sale.unitPrice)}/unit
                    </p>
                  </div>
                  <Badge variant="outline">
                    {new Date(sale.date).toLocaleDateString()}
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