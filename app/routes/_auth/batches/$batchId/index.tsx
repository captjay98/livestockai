import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ProjectionsCard } from '~/components/batches/projections-card'
import { BatchCommandCenter } from '~/components/batches/command-center'
import { BatchHeader } from '~/components/batches/batch-details/batch-header'
import { BatchKPIs } from '~/components/batches/batch-details/batch-kpis'
import { FeedRecordsTab } from '~/components/batches/batch-details/feed-records-tab'
import { MortalityRecordsTab } from '~/components/batches/batch-details/mortality-records-tab'
import { ExpensesTab } from '~/components/batches/batch-details/expenses-tab'
import { SalesTab } from '~/components/batches/batch-details/sales-tab'
import { useBatchDetails } from '~/features/batches/use-batch-details'

export const Route = createFileRoute('/_auth/batches/$batchId/')({
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
  const {
    details,
    feedRecords,
    mortalityRecords,
    expenses,
    sales,
    metrics,
    isLoading,
  } = useBatchDetails(batchId)

  if (isLoading || !details || !metrics) {
    return (
      <div className="p-8 text-center">
        {t('common:loading.details', { defaultValue: 'Loading details...' })}
      </div>
    )
  }

  const { batch } = details

  return (
    <div className="space-y-6">
      <BatchHeader batch={batch} onEdit={() => {}} onDelete={() => {}} />

      <BatchCommandCenter batchId={batchId} />

      <BatchKPIs metrics={metrics} />

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
          <FeedRecordsTab records={feedRecords} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="projections" className="mt-4">
          <ProjectionsCard batchId={batch.id} />
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <MortalityRecordsTab
            records={mortalityRecords}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <ExpensesTab records={expenses} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <SalesTab records={sales} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
