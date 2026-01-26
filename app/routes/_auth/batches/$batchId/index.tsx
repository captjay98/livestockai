import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Target, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { ProjectionsCard } from '~/components/batches/projections-card'
import { GrowthChart } from '~/components/batches/growth-chart'
import { BatchCommandCenter } from '~/components/batches/command-center'
import { BatchHeader } from '~/components/batches/batch-details/batch-header'
import { BatchKPIs } from '~/components/batches/batch-details/batch-kpis'
import { FeedRecordsTab } from '~/components/batches/batch-details/feed-records-tab'
import { MortalityRecordsTab } from '~/components/batches/batch-details/mortality-records-tab'
import { ExpensesTab } from '~/components/batches/batch-details/expenses-tab'
import { SalesTab } from '~/components/batches/batch-details/sales-tab'
import { getBatchDetailsFn } from '~/features/batches/server'
import { BatchDetailSkeleton } from '~/components/batches/batch-detail-skeleton'

export const Route = createFileRoute('/_auth/batches/$batchId/')({
  loader: async ({ params }) =>
    getBatchDetailsFn({ data: { batchId: params.batchId } }),
  pendingComponent: BatchDetailSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      Error loading batch details: {error.message}
    </div>
  ),
  component: BatchDetailsPage,
})

function BatchDetailsPage() {
  const { t } = useTranslation([
    'batches',
    'common',
    'dashboard',
    'sales',
    'feed',
    'mortality',
  ])
  const { batchId } = Route.useParams()
  const data = Route.useLoaderData()
  const [targetWeightPromptDismissed, setTargetWeightPromptDismissed] = useState(false)

  const { batch, mortality, feed, sales, expenses } = data

  // Create metrics object from the data structure
  const metrics = {
    currentQuantity: batch.currentQuantity,
    initialQuantity: batch.initialQuantity,
    mortalityCount: mortality.totalQuantity,
    mortalityRate: mortality.rate,
    feedTotalKg: feed.totalKg,
    feedFcr: feed.fcr,
    totalInvestment: Number(batch.totalCost),
    costPerUnit: Number(batch.costPerUnit),
    totalRevenue: sales.totalRevenue,
    totalSold: sales.totalQuantity,
    avgSalesPrice:
      sales.totalQuantity > 0 ? sales.totalRevenue / sales.totalQuantity : 0,
    netProfit:
      sales.totalRevenue -
      Number(batch.totalCost) -
      feed.totalCost -
      expenses.total,
    roi:
      Number(batch.totalCost) > 0
        ? ((sales.totalRevenue -
            Number(batch.totalCost) -
            feed.totalCost -
            expenses.total) /
            Number(batch.totalCost)) *
          100
        : 0,
  }

  return (
    <div className="space-y-6">
      <BatchHeader batch={batch} onEdit={() => {}} onDelete={() => {}} />

      <BatchCommandCenter batchId={batchId} />

      <BatchKPIs metrics={metrics} batchId={batchId} />

      <Tabs defaultValue="feed" className="w-full">
        <TabsList>
          <TabsTrigger value="feed">
            {t('tabs.feed', { defaultValue: 'Feed Logs' })}
          </TabsTrigger>
          <TabsTrigger value="growth">
            {t('tabs.growth', { defaultValue: 'Growth' })}
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
          <FeedRecordsTab records={[]} isLoading={false} />
        </TabsContent>

        <TabsContent value="growth" className="mt-4">
          <GrowthChart batchId={batch.id} acquisitionDate={batch.acquisitionDate} />
        </TabsContent>

        <TabsContent value="projections" className="mt-4">
          {!batch.target_weight_g && !targetWeightPromptDismissed && (
            <Alert className="mb-4">
              <Target className="h-4 w-4" />
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <AlertTitle>Set Target Weight</AlertTitle>
                  <AlertDescription>
                    Add a target weight to enable growth projections and harvest date predictions.
                  </AlertDescription>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {/* TODO: Implement edit dialog */}}
                  >
                    Edit Batch
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTargetWeightPromptDismissed(true)}
                  className="ml-2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          )}
          <ProjectionsCard batchId={batch.id} />
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <MortalityRecordsTab records={[]} isLoading={false} />
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <ExpensesTab records={[]} isLoading={false} />
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <SalesTab records={[]} isLoading={false} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
