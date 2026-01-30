import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { ExternalLink, Target, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
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
import { DetailSkeleton } from '~/components/ui/detail-skeleton'
import { ErrorPage } from '~/components/error-page'

function FormulationCard({ formulation }: { formulation: any }) {
  const { t } = useTranslation(['batches'])

  return (
    <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden relative group max-w-sm">
      {/* Decorative Orbs */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform" />

      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
          {t('formulation.title', {
            defaultValue: 'Feed Formulation',
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 relative z-10">
        <div>
          <span className="text-lg font-black tracking-tight">
            {formulation.name}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
          <span className="bg-white/40 dark:bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
            {formulation.species}
          </span>
          <span className="opacity-30">•</span>
          <span className="bg-white/40 dark:bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
            {formulation.stage}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground">
            Cost per Kg
          </div>
          <div className="text-base font-black text-primary">
            {formulation.costPerKg}/kg
          </div>
        </div>
        <Link
          to="/feed-formulation"
          search={{ highlight: formulation.id }}
          className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors pt-1"
        >
          View Details <ExternalLink className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  )
}

export const Route = createFileRoute('/_auth/batches/$batchId/')({
  loader: async ({ params }) =>
    getBatchDetailsFn({ data: { batchId: params.batchId } }),
  pendingComponent: () => (
    <DetailSkeleton
      sections={[
        { type: 'header' },
        { type: 'actions', props: { count: 3 } },
        { type: 'cards', props: { count: 4 } },
        { type: 'tabs', props: { count: 6 } },
      ]}
    />
  ),
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
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
  const [targetWeightPromptDismissed, setTargetWeightPromptDismissed] =
    useState(false)

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

      <BatchKPIs
        metrics={metrics}
        batchId={batchId}
        acquisitionDate={batch.acquisitionDate}
        targetHarvestDate={batch.targetHarvestDate}
      />

      {batch.formulation && <FormulationCard formulation={batch.formulation} />}

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="w-full grid grid-cols-3 lg:grid-cols-6 h-auto p-1.5">
          <TabsTrigger value="feed" className="w-full">
            {t('tabs.feed', { defaultValue: 'Feed Logs' })}
          </TabsTrigger>
          <TabsTrigger value="growth" className="w-full">
            {t('tabs.growth', { defaultValue: 'Growth' })}
          </TabsTrigger>
          <TabsTrigger value="projections" className="w-full">
            {t('tabs.projections', { defaultValue: 'Projections' })}
          </TabsTrigger>
          <TabsTrigger value="health" className="w-full">
            {t('tabs.health', {
              defaultValue: 'Mortality & Health',
            })}
          </TabsTrigger>
          <TabsTrigger value="expenses" className="w-full">
            {t('tabs.expenses', { defaultValue: 'Expenses' })}
          </TabsTrigger>
          <TabsTrigger value="sales" className="w-full">
            {t('tabs.sales', { defaultValue: 'Sales' })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-4">
          <FeedRecordsTab records={[]} isLoading={false} />
        </TabsContent>

        <TabsContent value="growth" className="mt-4">
          <GrowthChart
            batchId={batch.id}
            acquisitionDate={batch.acquisitionDate}
          />
        </TabsContent>

        <TabsContent value="projections" className="mt-4">
          {!batch.target_weight_g && !targetWeightPromptDismissed && (
            <Alert className="mb-6 bg-primary/5 dark:bg-primary/10 border-primary/20 backdrop-blur-md rounded-2xl p-4 shadow-lg shadow-primary/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-12 translate-x-12" />
              <Target className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 ml-4">
                  <AlertTitle className="text-lg font-black tracking-tight text-primary">
                    Set Target Weight
                  </AlertTitle>
                  <AlertDescription className="text-sm font-medium text-muted-foreground/80 mt-1 max-w-xl">
                    Add a target weight to enable growth projections and harvest
                    date predictions.
                  </AlertDescription>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-xl font-bold bg-white/40 dark:bg-white/5 border-primary/20 hover:bg-primary/10 text-primary transition-all shadow-sm"
                    onClick={() => {
                      /* TODO: Implement edit dialog */
                    }}
                  >
                    Edit Batch
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTargetWeightPromptDismissed(true)}
                  className="ml-2 h-8 w-8 p-0 rounded-full hover:bg-primary/10 text-primary/60 hover:text-primary transition-all"
                >
                  <X className="h-5 w-5" />
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
