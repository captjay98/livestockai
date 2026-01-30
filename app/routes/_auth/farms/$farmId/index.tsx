import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActiveBatch } from '~/components/farms/active-batches-card'
import type {
  RecentExpense,
  RecentSale,
} from '~/components/farms/farm-recent-activity-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { getFarmDetailsFn } from '~/features/farms/server'
import { Button } from '~/components/ui/button'
import { ExpenseDialog } from '~/components/expenses/expense-dialog'
import { FarmDialog } from '~/components/farms/farm-dialog'
import { StructuresCard } from '~/components/farms/structures-card'
import { ActiveBatchesCard } from '~/components/farms/active-batches-card'
import { FarmHeader } from '~/components/farms/farm-header'
import { FarmRecentActivityCard } from '~/components/farms/farm-recent-activity-card'
import { FarmQuickActions } from '~/components/farms/farm-quick-actions'
import { FarmInfoCard } from '~/components/farms/farm-info-card'
import { FarmStatsRow } from '~/components/farms/farm-stats-row'
import { FarmDetailSkeleton } from '~/components/farms/farm-detail-skeleton'
import { SensorStatusCard } from '~/components/sensors/sensor-status-card'
import { AccessRequestsCard } from '~/components/extension/access-requests-card'
import { VisitHistoryCard } from '~/components/extension/visit-history-card'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/farms/$farmId/')({
  component: FarmDetailsPage,
  loader: ({ params }) => getFarmDetailsFn({ data: { farmId: params.farmId } }),
  pendingComponent: FarmDetailSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
})

function FarmDetailsPage() {
  const { t } = useTranslation(['farms', 'common', 'batches', 'expenses'])
  const loaderData = Route.useLoaderData()
  const { farmId } = Route.useParams()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)

  const {
    farm,
    stats,
    activeBatches,
    recentSales,
    recentExpenses,
    structures,
    sensorSummary,
  } = loaderData

  if (!farm) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            {t('farms:detail.notFound')}
          </h1>
          <p className="text-muted-foreground mb-4">
            {t('farms:detail.notFoundDesc')}
          </p>
          <Link to="/farms">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('farms:detail.back')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FarmHeader farm={farm} onEdit={() => setEditDialogOpen(true)} />

      <FarmDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        farm={{
          id: farm.id,
          name: farm.name,
          location: farm.location,
          type: farm.type as 'poultry' | 'aquaculture' | 'mixed',
        }}
      />

      {/* Stats Row */}
      <FarmStatsRow stats={stats} />

      {/* Tabs Interface */}
      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="w-full grid grid-cols-2 lg:grid-cols-4 h-auto p-1.5">
          <TabsTrigger value="overview" className="w-full">
            {t('farms:detail.tabs.overview', 'Overview')}
          </TabsTrigger>
          <TabsTrigger value="facilities" className="w-full">
            {t('farms:detail.tabs.facilities', 'Facilities')}
          </TabsTrigger>
          <TabsTrigger value="activity" className="w-full">
            {t('farms:detail.tabs.activity', 'Activity')}
          </TabsTrigger>
          <TabsTrigger value="settings" className="w-full">
            {t('farms:detail.tabs.settings', 'Settings')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <FarmQuickActions
                farmId={farmId}
                onRecordExpense={() => setExpenseDialogOpen(true)}
              />
              <ActiveBatchesCard
                batches={activeBatches as unknown as Array<ActiveBatch>}
              />
            </div>
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/10 backdrop-blur-md text-sm text-foreground/80 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-16 translate-x-16 pointer-events-none" />
                <h4 className="font-bold text-foreground mb-1.5 relative z-10">
                  {t('farms:quickActions.tip.title')}
                </h4>
                <p className="leading-relaxed relative z-10">
                  {t('farms:quickActions.tip.text')}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <StructuresCard farmId={farmId} initialStructures={structures} />
            <SensorStatusCard {...sensorSummary} />
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <FarmRecentActivityCard
              recentSales={recentSales as unknown as Array<RecentSale>}
              recentExpenses={recentExpenses as unknown as Array<RecentExpense>}
            />
            <VisitHistoryCard farmId={farmId} />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <FarmInfoCard farm={farm} />
            <AccessRequestsCard farmId={farmId} />
          </div>
        </TabsContent>
      </Tabs>

      <ExpenseDialog
        farmId={farmId}
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
      />
    </div>
  )
}
