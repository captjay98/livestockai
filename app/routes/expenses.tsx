import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getExpensesForFarm, getExpensesSummary } from '~/lib/expenses/server'
import { EXPENSE_CATEGORIES } from '~/lib/expenses/constants'
import { getFarmsForUser } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
import { formatNaira } from '~/lib/currency'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { FarmSelector } from '~/components/farm-selector'
import { Plus, Receipt, TrendingDown, Repeat } from 'lucide-react'
import { useState } from 'react'

interface Farm {
  id: string
  name: string
  type: string
}

interface Expense {
  id: string
  category: string
  amount: string
  date: Date
  description: string
  supplierName: string | null
  isRecurring: boolean
}

interface ExpensesSummary {
  byCategory: Record<string, { count: number; amount: number }>
  total: { count: number; amount: number }
}

interface ExpensesData {
  farms: Farm[]
  expenses: Expense[]
  summary: ExpensesSummary | null
}

const getFarms = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const session = await requireAuth()
    const farms = await getFarmsForUser(session.user.id)
    return { farms, expenses: [], summary: null }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      throw redirect({ to: '/login' })
    }
    throw error
  }
})

const getExpensesDataForFarm = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireAuth()
      const [expenses, summary] = await Promise.all([
        getExpensesForFarm(session.user.id, data.farmId),
        getExpensesSummary(session.user.id, data.farmId),
      ])
      return { expenses, summary, farms: [] as Farm[] }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

interface ExpensesSearchParams {
  farmId?: string
}

export const Route = createFileRoute('/expenses')({
  component: ExpensesPage,
  validateSearch: (search: Record<string, unknown>): ExpensesSearchParams => ({
    farmId: typeof search.farmId === 'string' ? search.farmId : undefined,
  }),
  loaderDeps: ({ search }) => ({ farmId: search.farmId }),
  loader: async ({ deps }) => {
    if (deps.farmId) {
      return getExpensesDataForFarm({ data: { farmId: deps.farmId } })
    }
    return getFarms()
  },
})

function ExpensesPage() {
  const { expenses, summary, farms } = Route.useLoaderData() as ExpensesData
  const search = Route.useSearch()
  const [selectedFarm, setSelectedFarm] = useState(search.farmId || '')

  const handleFarmChange = (farmId: string) => {
    setSelectedFarm(farmId)
    window.history.pushState({}, '', `/expenses?farmId=${farmId}`)
    window.location.reload()
  }

  if (!selectedFarm && farms.length > 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Expenses</h1>
            <p className="text-muted-foreground mt-1">Track your business expenses</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a farm</h3>
            <p className="text-muted-foreground mb-4">Choose a farm to view expenses</p>
            <FarmSelector onFarmChange={handleFarmChange} />
          </CardContent>
        </Card>
      </div>
    )
  }

  const getCategoryLabel = (category: string) => {
    return EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track your business expenses</p>
        </div>
        <div className="flex gap-3">
          <FarmSelector selectedFarmId={selectedFarm} onFarmChange={handleFarmChange} />
          <Link to="/expenses/new" search={{ farmId: selectedFarm }}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Expense
            </Button>
          </Link>
        </div>
      </div>

      {summary && (
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(summary.total.amount)}</div>
              <p className="text-xs text-muted-foreground">{summary.total.count} transactions</p>
            </CardContent>
          </Card>

          {Object.entries(summary.byCategory).slice(0, 3).map(([category, data]) => (
            <Card key={category}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{getCategoryLabel(category)}</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNaira(data.amount)}</div>
                <p className="text-xs text-muted-foreground">{data.count} transactions</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {expenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
            <p className="text-muted-foreground mb-4">Record your first expense</p>
            <Link to="/expenses/new" search={{ farmId: selectedFarm }}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Expense
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Expense History</CardTitle>
            <CardDescription>Recent expense transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {getCategoryLabel(expense.category)}
                        {expense.supplierName && ` • ${expense.supplierName}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-destructive">{formatNaira(expense.amount)}</p>
                      {expense.isRecurring && (
                        <Badge variant="outline" className="text-xs">
                          <Repeat className="h-3 w-3 mr-1" />
                          Recurring
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline">
                      {new Date(expense.date).toLocaleDateString()}
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