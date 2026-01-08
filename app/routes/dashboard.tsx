import { createFileRoute, Link, useSearch, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getFarmsForUser } from '~/lib/farms/server'
import { getInventorySummary } from '~/lib/batches/server'
import { getMortalityAlerts } from '~/lib/mortality/server'
import { getDashboardStats } from '~/lib/dashboard/server'
import { requireAuth } from '~/lib/auth/middleware'
import { formatNaira } from '~/lib/currency'
import { buttonVariants } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { FarmSelector } from '~/components/farm-selector'
import { Header } from '~/components/navigation'
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Building2, 
  Plus,
  Bird,
  Fish,
  TrendingDown,
  Egg,
  DollarSign,
  Receipt,
  Syringe,
  Droplets,
  UserCircle,
  ShoppingCart
} from 'lucide-react'
import { useState } from 'react'

interface MortalityAlert {
  batchId: string
  species: string
  rate: number
  severity: 'warning' | 'critical'
}

interface VaccinationAlert {
  species: string
  vaccineName: string
  dueDate: string
}

interface WaterQualityAlert {
  parameter: string
  value: string
}

interface TopCustomer {
  id: string
  name: string
  totalSpent: number
}

interface Transaction {
  id: string
  type: 'sale' | 'expense'
  description: string
  amount: number
}

const getDashboardData = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      
      const farms = await getFarmsForUser(session.user.id)
      
      if (!data.farmId && farms.length === 0) {
        return { farms, summary: null, alerts: [], stats: null }
      }

      const farmIdToUse = data.farmId || (farms.length > 0 ? farms[0].id : undefined)

      const [summary, alerts, stats] = await Promise.all([
        farmIdToUse ? getInventorySummary(session.user.id, farmIdToUse) : null,
        farmIdToUse ? getMortalityAlerts(session.user.id, farmIdToUse) : [],
        getDashboardStats(farmIdToUse),
      ])

      return { summary, alerts, farms, stats }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface DashboardSearchParams {
  farmId?: string
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
  validateSearch: (search: Record<string, unknown>): DashboardSearchParams => ({
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }),
  loaderDeps: ({ search }) => ({ farmId: search.farmId }),
  loader: ({ deps }) => getDashboardData({ data: { farmId: deps.farmId ?? '' } }),
})

function DashboardPage() {
  const loaderData = Route.useLoaderData()
  const farms = loaderData?.farms ?? []
  const stats = loaderData?.stats ?? null
  const search = useSearch({ from: '/dashboard' })
  const [selectedFarm, setSelectedFarm] = useState(search?.farmId ?? '')

  const handleFarmChange = (farmId: string) => {
    setSelectedFarm(farmId)
    window.history.pushState({}, '', `/dashboard?farmId=${farmId}`)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6 px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your farm operations
            </p>
          </div>
          {farms.length > 0 && (
            <FarmSelector selectedFarmId={selectedFarm} onFarmChange={handleFarmChange} />
          )}
        </div>

        {farms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No farms yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first farm to start tracking
              </p>
              <Link to="/farms/new" className={buttonVariants()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Farm
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Financial Overview */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {formatNaira(stats.financial.monthlyRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">This month's sales</p>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                    <Receipt className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                      {formatNaira(stats.financial.monthlyExpenses)}
                    </div>
                    <p className="text-xs text-muted-foreground">This month's costs</p>
                  </CardContent>
                </Card>

                <Card className={stats.financial.monthlyProfit >= 0 
                  ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
                  : "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900"
                }>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      stats.financial.monthlyProfit >= 0 
                        ? 'text-blue-700 dark:text-blue-400' 
                        : 'text-orange-700 dark:text-orange-400'
                    }`}>
                      {formatNaira(stats.financial.monthlyProfit)}
                    </div>
                    <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Inventory Metrics */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Poultry</CardTitle>
                    <Bird className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.inventory.totalPoultry.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total birds</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fish</CardTitle>
                    <Fish className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.inventory.totalFish.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total fish</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Eggs This Month</CardTitle>
                    <Egg className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.production.eggsThisMonth.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.production.layingPercentage}% laying rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.inventory.activeBatches}</div>
                    <p className="text-xs text-muted-foreground">Currently active</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Alerts Section */}
            {stats && (stats.alerts.highMortality.length > 0 || 
              stats.alerts.overdueVaccinations.length > 0 || 
              stats.alerts.waterQualityAlerts.length > 0) && (
              <Card className="mb-6 border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Alerts Requiring Attention
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.alerts.highMortality.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        High Mortality Batches
                      </h4>
                      <div className="space-y-2">
                        {stats.alerts.highMortality.map((alert: MortalityAlert) => (
                          <div key={alert.batchId} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                            <span>{alert.species}</span>
                            <Badge variant="destructive">{alert.rate.toFixed(1)}% mortality</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.alerts.overdueVaccinations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Syringe className="h-4 w-4" />
                        Overdue Vaccinations
                      </h4>
                      <div className="space-y-2">
                        {stats.alerts.overdueVaccinations.map((alert: VaccinationAlert, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-orange-100 dark:bg-orange-950/30 rounded">
                            <span>{alert.species} - {alert.vaccineName}</span>
                            <Badge variant="outline" className="text-orange-600">
                              Due {new Date(alert.dueDate).toLocaleDateString()}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.alerts.waterQualityAlerts.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        Water Quality Issues
                      </h4>
                      <div className="space-y-2">
                        {stats.alerts.waterQualityAlerts.map((alert: WaterQualityAlert, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-blue-100 dark:bg-blue-950/30 rounded">
                            <span>{alert.parameter}</span>
                            <Badge variant="outline" className="text-blue-600">
                              {alert.value}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upcoming Vaccinations */}
            {stats && stats.alerts.upcomingVaccinations.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Syringe className="h-5 w-5" />
                    Upcoming Vaccinations (Next 7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.alerts.upcomingVaccinations.map((vax: VaccinationAlert, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>{vax.species} - {vax.vaccineName}</span>
                        <Badge variant="secondary">
                          {new Date(vax.dueDate).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2 mb-6">
              {/* Top Customers */}
              {stats && stats.topCustomers.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <UserCircle className="h-5 w-5" />
                        Top Customers
                      </CardTitle>
                      <Link to="/customers" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>View All</Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.topCustomers.map((customer: TopCustomer, i: number) => (
                        <div key={customer.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
                            <span className="font-medium">{customer.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatNaira(customer.totalSpent)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Transactions */}
              {stats && stats.recentTransactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Recent Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.recentTransactions.slice(0, 5).map((tx: Transaction) => (
                        <div key={tx.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant={tx.type === 'sale' ? 'default' : 'secondary'} className="w-16 justify-center">
                              {tx.type}
                            </Badge>
                            <span className="text-sm truncate max-w-[150px]">{tx.description}</span>
                          </div>
                          <span className={`text-sm font-medium ${
                            tx.type === 'sale' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {tx.type === 'sale' ? '+' : '-'}{formatNaira(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks for managing your farm</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  <Link to="/batches/new" className={buttonVariants({ variant: 'outline', className: 'h-auto p-4' })}>
                      <div className="text-center">
                        <Plus className="h-6 w-6 mx-auto mb-2" />
                        <div className="font-medium">Add Batch</div>
                      </div>
                  </Link>

                  <Link to="/sales/new" className={buttonVariants({ variant: 'outline', className: 'h-auto p-4' })}>
                      <div className="text-center">
                        <ShoppingCart className="h-6 w-6 mx-auto mb-2" />
                        <div className="font-medium">Record Sale</div>
                      </div>
                  </Link>

                  <Link to="/expenses/new" className={buttonVariants({ variant: 'outline', className: 'h-auto p-4' })}>
                      <div className="text-center">
                        <Receipt className="h-6 w-6 mx-auto mb-2" />
                        <div className="font-medium">Add Expense</div>
                      </div>
                  </Link>

                  <Link to="/reports" className={buttonVariants({ variant: 'outline', className: 'h-auto p-4' })}>
                      <div className="text-center">
                        <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                        <div className="font-medium">View Reports</div>
                      </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
