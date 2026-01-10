import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  ArrowLeft,
  Building2,
  Edit,
  MapPin,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { getFarmById, getFarmStats } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/server-middleware'
import { formatNaira } from '~/lib/currency'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { FarmDialog } from '~/components/dialogs/farm-dialog'

interface Farm {
  id: string
  name: string
  location: string
  type: 'poultry' | 'fishery' | 'mixed'
  createdAt: Date
  updatedAt: Date
}

interface FarmStats {
  batches: { total: number; active: number; totalLivestock: number }
  sales: { count: number; revenue: number }
  expenses: { count: number; amount: number }
}

const getFarmDetails = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()

      // Dynamically import backend functions to avoid server-code leakage
      const { getBatches } = await import('~/lib/batches/server')
      const { getSalesForFarm } = await import('~/lib/sales/server')
      const { getExpensesForFarm } = await import('~/lib/expenses/server')

      const [farm, stats, activeBatches, recentSales, recentExpenses] = await Promise.all([
        getFarmById(data.farmId, session.user.id),
        getFarmStats(data.farmId, session.user.id),
        getBatches(session.user.id, data.farmId, { status: 'active' }),
        getSalesForFarm(session.user.id, data.farmId, { limit: 5 }),
        getExpensesForFarm(session.user.id, data.farmId, { limit: 5 }),
      ])
      return { farm, stats, activeBatches, recentSales, recentExpenses }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/farms/$farmId/')({
  component: FarmDetailsPage,
  loader: ({ params }) => getFarmDetails({ data: { farmId: params.farmId } }),
})

function FarmDetailsPage() {
  const { farm, stats, activeBatches, recentSales, recentExpenses } = Route.useLoaderData()
  const { farmId } = Route.useParams()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [activityTab, setActivityTab] = useState<'sales' | 'expenses'>('sales')

  if (!farm) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Farm not found</h1>
          <p className="text-muted-foreground mb-4">
            The farm you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <Link to="/farms">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Farms
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/farms">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Farms
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{farm.name}</h1>
            <Badge
              variant={
                farm.type === 'poultry'
                  ? 'default'
                  : farm.type === 'fishery'
                    ? 'secondary'
                    : 'outline'
              }
            >
              {farm.type}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {farm.location}
          </p>
        </div>
        <Button onClick={() => setEditDialogOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Farm
        </Button>
      </div>

      <FarmDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        farm={farm}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Info & Actions (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active Batches */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Active Batches</CardTitle>
              <Link to="/batches" search={{ farmId }}>
                <Button variant="link" size="sm" className="h-8">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activeBatches.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No active batches found.
                  <div className="mt-2">
                    <Link to="/batches" search={{ farmId }}>
                      <Button variant="outline" size="sm">Create Batch</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBatches.map((batch) => (
                    <div key={batch.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                      <div>
                        <div className="font-medium capitalize">{batch.species}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(batch.acquisitionDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{batch.currentQuantity.toLocaleString()}</div>
                        <Badge variant="outline" className="text-xs uppercase">
                          {batch.livestockType}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <div className="flex bg-muted rounded-md p-1">
                  <button
                    onClick={() => setActivityTab('sales')}
                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${activityTab === 'sales'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Sales
                  </button>
                  <button
                    onClick={() => setActivityTab('expenses')}
                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${activityTab === 'expenses'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Expenses
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activityTab === 'sales' ? (
                recentSales.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">No recent sales recorded.</p>
                ) : (
                  <div className="space-y-4">
                    {recentSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                        <div>
                          <div className="font-medium">{sale.customerName || 'Unknown Customer'}</div>
                          <div className="text-sm text-muted-foreground">
                            {sale.quantity} {sale.batchSpecies || sale.livestockType}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">+{formatNaira(Number(sale.totalAmount))}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(sale.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 text-center">
                      <Link to="/sales" search={{ farmId }}>
                        <Button variant="ghost" size="sm" className="w-full">View All Sales</Button>
                      </Link>
                    </div>
                  </div>
                )
              ) : (
                recentExpenses.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">No recent expenses recorded.</p>
                ) : (
                  <div className="space-y-4">
                    {recentExpenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                        <div>
                          <div className="font-medium capitalize">{expense.category}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {expense.description}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-destructive">-{formatNaira(Number(expense.amount))}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 text-center">
                      <Link to="/expenses" search={{ farmId }}>
                        <Button variant="ghost" size="sm" className="w-full">View All Expenses</Button>
                      </Link>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for managing this farm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link to="/batches" search={{ farmId }} className="w-full">
                  <Button variant="outline" className="h-auto p-4 w-full glass flex flex-col items-center justify-center gap-2 hover:bg-accent">
                    <Building2 className="h-6 w-6 text-primary" />
                    <div className="font-medium">Manage Batches</div>
                  </Button>
                </Link>

                <Link to="/sales/new" search={{ farmId }} className="w-full">
                  <Button variant="outline" className="h-auto p-4 w-full glass text-emerald-600 flex flex-col items-center justify-center gap-2 hover:bg-emerald-50">
                    <TrendingUp className="h-6 w-6" />
                    <div className="font-medium">Record Sale</div>
                  </Button>
                </Link>

                <Link to="/expenses/new" search={{ farmId }} className="w-full">
                  <Button variant="outline" className="h-auto p-4 w-full glass text-destructive flex flex-col items-center justify-center gap-2 hover:bg-red-50">
                    <TrendingDown className="h-6 w-6" />
                    <div className="font-medium">Record Expense</div>
                  </Button>
                </Link>

                <Link to="/reports" search={{ farmId }} className="w-full">
                  <Button variant="outline" className="h-auto p-4 w-full glass text-blue-600 flex flex-col items-center justify-center gap-2 hover:bg-blue-50">
                    <Building2 className="h-6 w-6" />
                    <div className="font-medium">View Reports</div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Farm Information */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Farm Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-sm border-b pb-1">{farm.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="text-sm capitalize border-b pb-1">{farm.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Location
                  </p>
                  <p className="text-sm border-b pb-1">{farm.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Created
                  </p>
                  <p className="text-sm border-b pb-1">
                    {new Date(farm.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livestock</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.batches.totalLivestock.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.batches.active} active batches
              </p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Revenue (30 days)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNaira(stats.sales.revenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.sales.count} sales transactions
              </p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expenses (30 days)
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNaira(stats.expenses.amount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.expenses.count} expense records
              </p>
            </CardContent>
          </Card>

          <div className="p-4 rounded-lg bg-muted/50 border border-muted text-sm text-muted-foreground">
            <h4 className="font-semibold text-foreground mb-1">Tip</h4>
            <p>Use the Quick Actions to efficiently manage your farm's daily operations.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
