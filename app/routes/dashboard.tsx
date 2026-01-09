import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  Activity,
  AlertTriangle,
  Bird,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Droplets,
  Edit,
  Egg,
  Fish,
  MoreHorizontal,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
  Syringe,
  TrendingDown,
  TrendingUp,
  UserCircle,
  Users,
  Wheat,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getInventorySummary } from '~/lib/batches/server'
import { getMortalityAlerts } from '~/lib/mortality/server'
import { getDashboardStats } from '~/lib/dashboard/server'
import { getUserFarms, requireAuth } from '~/lib/auth/middleware'
import { formatNaira } from '~/lib/currency'
import { buttonVariants } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { useFarm } from '~/components/farm-context'
import { cn } from '~/lib/utils'
import { ExpenseDialog } from '~/components/dialogs/expense-dialog'
import { EditFarmDialog } from '~/components/dialogs/edit-farm-dialog'

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
  date: Date
}

interface Farm {
  id: string
  name: string
  location: string
  type: 'poultry' | 'fishery' | 'mixed'
}

const getDashboardData = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId?: string | null } | undefined) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const farmId = data?.farmId || undefined

      const [summary, alerts, stats, userFarms] = await Promise.all([
        getInventorySummary(session.user.id, farmId),
        getMortalityAlerts(session.user.id, farmId),
        getDashboardStats(session.user.id, farmId),
        getUserFarms(session.user.id),
      ])

      return {
        summary,
        alerts: Array.isArray(alerts) ? alerts : [],
        stats,
        hasFarms: userFarms.length > 0,
        farms: userFarms.length > 0 ? userFarms : [],
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

// Simple arrow icons inline
function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  )
}

function TrendingDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 18l-9.5-9.5-5 5L1 6" />
      <path d="M17 18h6v-6" />
    </svg>
  )
}

 
function DashboardPage() {
  const { selectedFarmId } = useFarm()
   
  const [stats, setStats] = useState<any>(null)
  const [hasFarms, setHasFarms] = useState<boolean | null>(null)
  const [farms, setFarms] = useState<Array<Farm>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editFarmDialogOpen, setEditFarmDialogOpen] = useState(false)
  const [selectedFarmForEdit, setSelectedFarmForEdit] = useState<Farm | null>(
    null,
  )

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const result = await getDashboardData({
          data: { farmId: selectedFarmId },
        })
        setStats(result.stats)
        setHasFarms(result.hasFarms)
        setFarms(result.farms)
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [selectedFarmId])

  const openEditFarmDialog = (farm: Farm) => {
    setSelectedFarmForEdit(farm)
    setEditFarmDialogOpen(true)
  }

  if (hasFarms === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4 sm:p-8">
        <div className="bg-muted p-6 sm:p-8 rounded-xl mb-6">
          <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-foreground mx-auto" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          Welcome to JayFarms
        </h1>
        <p className="text-muted-foreground text-base max-w-md mb-6">
          Your complete poultry and fishery management solution. Start by
          creating your first farm.
        </p>
        <Link to="/farms" className={buttonVariants({ size: 'lg' })}>
          <Plus className="h-5 w-5 mr-2" />
          Create Your First Farm
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-5 w-64 bg-muted rounded-lg" />
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 sm:h-28 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Here's what's happening on your farms.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Farm Selector / Edit */}
          <div className="flex items-center gap-2">
            {farms.length > 0 && (
              <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{farms[0]?.name}</span>
                <button
                  onClick={() => farms[0] && openEditFarmDialog(farms[0])}
                  className="p-1 hover:bg-background rounded transition-colors"
                >
                  <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Last updated: Just now</span>
          </div>
        </div>
      </div>

      {!stats ? (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="py-12 sm:py-16 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No data available yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Start adding batches to see your metrics.
            </p>
            <Link to="/batches/new" className={buttonVariants()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Batch
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Revenue
                    </p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {formatNaira(stats.financial.monthlyRevenue)}
                    </p>
                    {stats.financial.revenueChange !== undefined && (
                      <div className="flex items-center gap-1 text-xs">
                        <span
                          className={cn(
                            'flex items-center gap-0.5 font-medium',
                            stats.financial.revenueChange >= 0
                              ? 'text-emerald-600'
                              : 'text-red-600',
                          )}
                        >
                          {stats.financial.revenueChange >= 0 ? (
                            <TrendingUpIcon className="h-3 w-3" />
                          ) : (
                            <TrendingDownIcon className="h-3 w-3" />
                          )}
                          {stats.financial.revenueChange >= 0 ? '+' : ''}
                          {stats.financial.revenueChange.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Expenses
                    </p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {formatNaira(stats.financial.monthlyExpenses)}
                    </p>
                    {stats.financial.expensesChange !== undefined && (
                      <div className="flex items-center gap-1 text-xs">
                        <span
                          className={cn(
                            'flex items-center gap-0.5 font-medium',
                            stats.financial.expensesChange >= 0
                              ? 'text-red-600'
                              : 'text-emerald-600',
                          )}
                        >
                          {stats.financial.expensesChange >= 0 ? (
                            <TrendingUpIcon className="h-3 w-3" />
                          ) : (
                            <TrendingDownIcon className="h-3 w-3" />
                          )}
                          {stats.financial.expensesChange >= 0 ? '+' : ''}
                          {stats.financial.expensesChange.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <Receipt className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Profit
                    </p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {formatNaira(stats.financial.monthlyProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground">Net margin</p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Batches
                    </p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {stats.inventory.activeBatches}
                    </p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Summary */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bird className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Poultry</p>
                    <p className="text-lg sm:text-xl font-bold">
                      {stats.inventory.totalPoultry.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Fish className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Fish</p>
                    <p className="text-lg sm:text-xl font-bold">
                      {stats.inventory.totalFish.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Egg className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Eggs</p>
                    <p className="text-lg sm:text-xl font-bold">
                      {stats.production.eggsThisMonth.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                <Link
                  to="/batches"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center"
                >
                  <Users className="h-5 w-5" />
                  <span className="text-xs font-medium">Batches</span>
                </Link>
                <Link
                  to="/feed"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center"
                >
                  <Wheat className="h-5 w-5" />
                  <span className="text-xs font-medium">Feed</span>
                </Link>
                <button
                  onClick={() => selectedFarmId && setExpenseDialogOpen(true)}
                  disabled={!selectedFarmId}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Receipt className="h-5 w-5" />
                  <span className="text-xs font-medium">Expense</span>
                </button>
                <Link
                  to="/sales/new"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-xs font-medium">New Sale</span>
                </Link>
                <Link
                  to="/eggs"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center"
                >
                  <Egg className="h-5 w-5" />
                  <span className="text-xs font-medium">Eggs</span>
                </Link>
                <Link
                  to="/reports"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center"
                >
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs font-medium">Reports</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Alerts */}
              {(stats.alerts.highMortality.length > 0 ||
                stats.alerts.overdueVaccinations.length > 0 ||
                stats.alerts.waterQualityAlerts.length > 0) && (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      Alerts
                      <Badge
                        variant="outline"
                        className="ml-auto bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                      >
                        {(stats.alerts.highMortality.length || 0) +
                          (stats.alerts.overdueVaccinations.length || 0) +
                          (stats.alerts.waterQualityAlerts.length || 0)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {stats.alerts.highMortality.map((alert: MortalityAlert) => (
                      <div
                        key={alert.batchId}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-background/80 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
                          <span className="truncate">
                            {alert.species} - {alert.rate}% mortality
                          </span>
                        </div>
                        <Badge
                          variant="destructive"
                          className="text-xs shrink-0 ml-2"
                        >
                          {alert.rate}%
                        </Badge>
                      </div>
                    ))}
                    {stats.alerts.overdueVaccinations.map(
                      (alert: VaccinationAlert, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-background/80 text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Syringe className="h-4 w-4 text-amber-600 shrink-0" />
                            <span className="truncate">
                              {alert.vaccineName} - {alert.species}
                            </span>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-amber-100 text-amber-700 shrink-0 ml-2"
                          >
                            Overdue
                          </Badge>
                        </div>
                      ),
                    )}
                    {stats.alerts.waterQualityAlerts.map(
                      (alert: WaterQualityAlert, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-background/80 text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Droplets className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="truncate">
                              {alert.parameter}: {alert.value}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs shrink-0 ml-2"
                          >
                            Check
                          </Badge>
                        </div>
                      ),
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Recent Transactions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.recentTransactions
                    .slice(0, 5)
                    .map((tx: Transaction) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                              tx.type === 'sale'
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-red-100 text-red-600',
                            )}
                          >
                            {tx.type === 'sale' ? (
                              <DollarSign className="h-4 w-4" />
                            ) : (
                              <Receipt className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {tx.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'font-bold text-sm shrink-0 ml-2',
                            tx.type === 'sale'
                              ? 'text-emerald-600'
                              : 'text-red-600',
                          )}
                        >
                          {tx.type === 'sale' ? '+' : '-'}
                          {formatNaira(tx.amount)}
                        </span>
                      </div>
                    ))}
                  {stats.recentTransactions.length === 0 && (
                    <p className="text-center py-4 text-sm text-muted-foreground">
                      No transactions yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Top Customers */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    Top Customers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.topCustomers.map(
                    (customer: TopCustomer, i: number) => (
                      <div
                        key={customer.id}
                        className="flex items-center gap-3"
                      >
                        <div
                          className={cn(
                            'h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                            i === 0
                              ? 'bg-amber-100 text-amber-700'
                              : i === 1
                                ? 'bg-slate-200 text-slate-600'
                                : i === 2
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-muted',
                          )}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {customer.name}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground shrink-0">
                          {formatNaira(customer.totalSpent)}
                        </span>
                      </div>
                    ),
                  )}
                  {stats.topCustomers.length === 0 && (
                    <p className="text-center py-4 text-sm text-muted-foreground">
                      No customer data yet
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {[
                      {
                        icon: Plus,
                        title: 'Batch added',
                        desc: 'New livestock',
                        time: '2h ago',
                        color: 'text-emerald-600 bg-emerald-100',
                      },
                      {
                        icon: ShoppingCart,
                        title: 'Sale recorded',
                        desc: 'Customer purchase',
                        time: '4h ago',
                        color: 'text-blue-600 bg-blue-100',
                      },
                      {
                        icon: Receipt,
                        title: 'Expense logged',
                        desc: 'Farm supplies',
                        time: 'Yesterday',
                        color: 'text-red-600 bg-red-100',
                      },
                      {
                        icon: TrendingDown,
                        title: 'Mortality',
                        desc: 'Health check',
                        time: 'Yesterday',
                        color: 'text-amber-600 bg-amber-100',
                      },
                    ].map((item, i) => (
                      <div key={i} className="relative">
                        <div
                          className={cn(
                            'absolute -left-[21px] top-0 h-7 w-7 rounded-full flex items-center justify-center',
                            item.color
                              .replace('text-', 'bg-')
                              .replace('600', '200'),
                          )}
                        >
                          <item.icon
                            className={cn('h-3.5 w-3.5', item.color)}
                          />
                        </div>
                        <div className="pl-2">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.desc}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {item.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Dialogs */}
      {selectedFarmId && (
        <ExpenseDialog
          farmId={selectedFarmId}
          open={expenseDialogOpen}
          onOpenChange={setExpenseDialogOpen}
        />
      )}
      {selectedFarmForEdit && (
        <EditFarmDialog
          farmId={selectedFarmForEdit.id}
          open={editFarmDialogOpen}
          onOpenChange={setEditFarmDialogOpen}
        />
      )}
    </div>
  )
}

export default DashboardPage
