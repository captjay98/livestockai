import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  Bird,
  Calendar,
  DollarSign,
  Edit,
  Fish,
  HeartPulse,
  Package,
  Trash2,
  TrendingDown,
  TrendingUp,
  Utensils,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '~/lib/utils'
import { getBatchDetailsFn } from '~/features/batches/server'
import { getFeedRecordsPaginatedFn } from '~/features/feed/server'
import { getMortalityRecordsPaginatedFn } from '~/features/mortality/server'
import { getExpensesPaginatedFn } from '~/features/expenses/server'
import { getSalesPaginatedFn } from '~/features/sales/server'
import {
  useFormatCurrency,
  useFormatDate,
  useFormatWeight,
} from '~/features/settings'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { DataTable } from '~/components/ui/data-table'
import { ProjectionsCard } from '~/components/batches/projections-card'
import { BatchCommandCenter } from '~/components/batches/command-center'

// Local interfaces matching server return types
interface FeedRecord {
  id: string
  batchId: string
  feedType: string
  brandName: string | null
  quantityKg: string
  cost: string
  date: Date
  notes: string | null
}

interface MortalityRecord {
  id: string
  batchId: string
  quantity: number
  date: Date
  cause: string
  notes: string | null
}

interface SaleRecord {
  id: string
  quantity: number
  totalAmount: string
  date: Date
  livestockType: string
  unitType?: string | null
  ageWeeks?: number | null
  paymentStatus?: string | null
}

export const Route = createFileRoute('/_auth/batches/$batchId/')({
  component: BatchDetailsPage,
})

function BatchDetailsPage() {
  const { t } = useTranslation(['batches', 'common', 'dashboard'])
  const { batchId } = Route.useParams()
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()
  const { format: formatWeight, label: weightLabel } = useFormatWeight()
  const [details, setDetails] = useState<Awaited<
    ReturnType<typeof getBatchDetailsFn>
  > | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Data States for Tabs
  const [feedRecords, setFeedRecords] = useState<Array<FeedRecord>>([])
  const [mortalityRecords, setMortalityRecords] = useState<
    Array<MortalityRecord>
  >([])
  const [expenses, setExpenses] = useState<
    Array<{
      id: string
      category: string
      amount: string
      date: Date
      description: string
    }>
  >([])
  const [sales, setSales] = useState<Array<SaleRecord>>([])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const result = await getBatchDetailsFn({ data: { batchId } })
        setDetails(result)

        // Load Tab Data (Parallel)
        const [feed, mortality, exp, sale] = await Promise.all([
          getFeedRecordsPaginatedFn({
            data: { batchId, page: 1, pageSize: 20 },
          }),
          getMortalityRecordsPaginatedFn({
            data: { batchId, page: 1, pageSize: 20 },
          }),
          getExpensesPaginatedFn({ data: { batchId, page: 1, pageSize: 20 } }),
          getSalesPaginatedFn({ data: { batchId, page: 1, pageSize: 20 } }),
        ])

        setFeedRecords(feed.data)
        setMortalityRecords(mortality.data)
        setExpenses(exp.data)
        setSales(sale.data)
      } catch (err) {
        console.error('Failed to load batch details:', err)
      } finally {
        setIsLoading(false)
      }
    }
    if (batchId) loadData()
  }, [batchId])

  if (isLoading || !details) {
    return <div className="p-8 text-center">Loading batch details...</div>
  }

  const {
    batch,
    mortality,
    feed,
    sales: batchSales,
    expenses: batchExpenses,
  } = details
  const ageInDays = Math.floor(
    (new Date().getTime() - new Date(batch.acquisitionDate).getTime()) /
    (1000 * 60 * 60 * 24),
  )

  const totalInvestment =
    Number(batch.totalCost) + feed.totalCost + (batchExpenses.total || 0)
  const netProfit = batchSales.totalRevenue - totalInvestment
  const costPerUnit =
    batch.currentQuantity > 0 ? totalInvestment / batch.currentQuantity : 0
  const avgSalesPrice =
    batchSales.totalQuantity > 0
      ? batchSales.totalRevenue / batchSales.totalQuantity
      : 0

  return (
    <div className="space-y-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/batches">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {batch.livestockType === 'poultry' ? (
                  <Bird className="h-6 w-6 text-orange-600" />
                ) : (
                  <Fish className="h-6 w-6 text-blue-600" />
                )}
                {batch.batchName || batch.species}
              </h1>
              <Badge
                variant={batch.status === 'active' ? 'default' : 'secondary'}
              >
                {batch.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1 flex-wrap">
              <span>{batch.species}</span>
              {batch.sourceSize && (
                <>
                  <span>•</span>
                  <span className="capitalize">{batch.sourceSize}</span>
                </>
              )}
              <span>•</span>
              <Calendar className="h-3 w-3" />
              <span>
                {formatDate(batch.acquisitionDate)} ({ageInDays} days)
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Command Center (Mobile-First Actions) */}
      <BatchCommandCenter batchId={batchId} />

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              {t('detail.currentStock', {
                defaultValue: 'Current Stock',
              })}
            </CardTitle>
            <Package className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">
              {batch.currentQuantity.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {batch.initialQuantity.toLocaleString()}{' '}
              {t('detail.initial', { defaultValue: 'initial' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              {t('common:mortality', { defaultValue: 'Mortality' })}
            </CardTitle>
            <HeartPulse className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{mortality.totalDeaths}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span
                className={
                  mortality.rate > 5
                    ? 'text-red-500 font-medium'
                    : 'text-green-500'
                }
              >
                {mortality.rate.toFixed(1)}%
              </span>
              <span className="ml-1">
                {t('dashboard:rate', { defaultValue: 'rate' })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              {t('common:feed', { defaultValue: 'Feed' })} ({weightLabel})
            </CardTitle>
            <Utensils className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">
              {feed.totalKg.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              FCR: {feed.fcr ? feed.fcr.toFixed(2) : '--'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              {t('common:expenses', { defaultValue: 'Expenses' })}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold truncate">
              {formatCurrency(totalInvestment)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(costPerUnit)} / unit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              {t('common:revenue', { defaultValue: 'Revenue' })}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold truncate">
              {formatCurrency(batchSales.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {batchSales.totalQuantity}{' '}
              {t('statuses.sold', { defaultValue: 'sold' })} @{' '}
              {formatCurrency(avgSalesPrice)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              {t('detail.profit', { defaultValue: 'Profit / Loss' })}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div
              className={cn(
                'text-lg font-bold truncate',
                netProfit >= 0 ? 'text-green-600' : 'text-red-500',
              )}
            >
              {formatCurrency(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalInvestment > 0
                ? ((netProfit / totalInvestment) * 100).toFixed(1)
                : 0}
              % {t('detail.roi', { defaultValue: 'ROI' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="feed" className="w-full">
        <TabsList>
          <TabsTrigger value="feed">
            {t('tabs.feed', { defaultValue: 'Feed Logs' })}
          </TabsTrigger>
          <TabsTrigger value="projections">
            {t('tabs.projections', { defaultValue: 'Projections' })}
          </TabsTrigger>
          <TabsTrigger value="health">
            {t('tabs.health', { defaultValue: 'Mortality & Health' })}
          </TabsTrigger>
          <TabsTrigger value="expenses">
            {t('tabs.expenses', { defaultValue: 'Expenses' })}
          </TabsTrigger>
          <TabsTrigger value="sales">
            {t('tabs.sales', { defaultValue: 'Sales' })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {t('feed.history', { defaultValue: 'Feeding History' })}
              </CardTitle>
              <CardDescription>
                {t('feed.recent', { defaultValue: 'Recent records' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    accessorKey: 'date',
                    header: t('common:date', { defaultValue: 'Date' }),
                    cell: ({ row }) => formatDate(row.original.date),
                  },
                  {
                    accessorKey: 'feedType',
                    header: 'Type',
                    cell: ({ row }) => (
                      <span className="capitalize">
                        {row.original.feedType.replace('_', ' ')}
                      </span>
                    ),
                  },
                  {
                    accessorKey: 'brandName',
                    header: 'Brand',
                    cell: ({ row }) => row.original.brandName || '-',
                  },
                  {
                    accessorKey: 'quantityKg',
                    header: `${t('common:quantity', { defaultValue: 'Qty' })} (${weightLabel})`,
                    cell: ({ row }) =>
                      formatWeight(parseFloat(row.original.quantityKg)),
                  },
                  {
                    accessorKey: 'cost',
                    header: t('common:price', { defaultValue: 'Cost' }),
                    cell: ({ row }) => formatCurrency(row.original.cost),
                  },
                ]}
                data={feedRecords}
                total={feedRecords.length}
                page={1}
                pageSize={20}
                totalPages={1}
                filters={null}
                isLoading={isLoading}
                onPaginationChange={() => { }}
                onSortChange={() => { }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="mt-4">
          <ProjectionsCard batchId={batch.id} />
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {t('mortality.records', {
                  defaultValue: 'Mortality Records',
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    accessorKey: 'date',
                    header: t('common:date', { defaultValue: 'Date' }),
                    cell: ({ row }) => formatDate(row.original.date),
                  },
                  {
                    accessorKey: 'quantity',
                    header: t('common:quantity', { defaultValue: 'Quantity' }),
                  },
                  {
                    accessorKey: 'cause',
                    header: 'Cause',
                    cell: ({ row }) => (
                      <span className="capitalize">{row.original.cause}</span>
                    ),
                  },
                  {
                    accessorKey: 'notes',
                    header: t('common:notes', { defaultValue: 'Notes' }),
                  },
                ]}
                data={mortalityRecords}
                total={mortalityRecords.length}
                page={1}
                pageSize={20}
                totalPages={1}
                filters={null}
                isLoading={isLoading}
                onPaginationChange={() => { }}
                onSortChange={() => { }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {t('common:expenses', { defaultValue: 'Expenses' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    accessorKey: 'date',
                    header: t('common:date', { defaultValue: 'Date' }),
                    cell: ({ row }) => formatDate(row.original.date),
                  },
                  {
                    accessorKey: 'category',
                    header: 'Category',
                    cell: ({ row }) => (
                      <span className="capitalize">
                        {row.original.category.replace('_', ' ')}
                      </span>
                    ),
                  },
                  {
                    accessorKey: 'amount',
                    header: 'Amount',
                    cell: ({ row }) => formatCurrency(row.original.amount),
                  },
                  { accessorKey: 'description', header: 'Description' },
                ]}
                data={expenses}
                total={expenses.length}
                page={1}
                pageSize={20}
                totalPages={1}
                filters={null}
                isLoading={isLoading}
                onPaginationChange={() => { }}
                onSortChange={() => { }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {t('sales.history', { defaultValue: 'Sales History' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    accessorKey: 'date',
                    header: t('common:date', { defaultValue: 'Date' }),
                    cell: ({ row }) => formatDate(row.original.date),
                  },
                  {
                    accessorKey: 'quantity',
                    header: t('common:quantity', { defaultValue: 'Qty' }),
                  },
                  {
                    accessorKey: 'unitType',
                    header: 'Unit',
                    cell: ({ row }) => (
                      <span className="capitalize">
                        {row.original.unitType || '-'}
                      </span>
                    ),
                  },
                  {
                    accessorKey: 'ageWeeks',
                    header: 'Age',
                    cell: ({ row }) =>
                      row.original.ageWeeks
                        ? `${row.original.ageWeeks} wks`
                        : '-',
                  },
                  {
                    accessorKey: 'totalAmount',
                    header: 'Amount',
                    cell: ({ row }) => formatCurrency(row.original.totalAmount),
                  },
                  {
                    accessorKey: 'paymentStatus',
                    header: t('common:status', { defaultValue: 'Status' }),
                    cell: ({ row }) => (
                      <Badge
                        variant={
                          row.original.paymentStatus === 'paid'
                            ? 'default'
                            : row.original.paymentStatus === 'pending'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {row.original.paymentStatus || 'paid'}
                      </Badge>
                    ),
                  },
                  {
                    accessorKey: 'customerName',
                    header: t('sales.customer', {
                      defaultValue: 'Customer',
                    }),
                  },
                ]}
                data={sales}
                total={sales.length}
                page={1}
                pageSize={20}
                totalPages={1}
                filters={null}
                isLoading={isLoading}
                onPaginationChange={() => { }}
                onSortChange={() => { }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  )
}
