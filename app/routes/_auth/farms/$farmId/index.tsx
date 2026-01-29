import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActiveBatch } from '~/components/farms/active-batches-card'
import type {
  RecentExpense,
  RecentSale,
} from '~/components/farms/farm-recent-activity-card'
import { getFarmDetailsFn } from '~/features/farms/server'
import { Button } from '~/components/ui/button'
import { SaleDialog } from '~/components/dialogs/sale-dialog'
import { ExpenseDialog } from '~/components/dialogs/expense-dialog'
import { FarmDialog } from '~/components/dialogs/farm-dialog'
import { StructuresCard } from '~/components/farms/structures-card'
import { ActiveBatchesCard } from '~/components/farms/active-batches-card'
import { FarmHeader } from '~/components/farms/farm-header'
import { FarmRecentActivityCard } from '~/components/farms/farm-recent-activity-card'
import { FarmQuickActions } from '~/components/farms/farm-quick-actions'
import { FarmInfoCard } from '~/components/farms/farm-info-card'
import { FarmStatsSidebar } from '~/components/farms/farm-stats-sidebar'
import { FarmDetailSkeleton } from '~/components/farms/farm-detail-skeleton'
import { SensorStatusCard } from '~/components/sensors/sensor-status-card'
import { AccessRequestsCard } from '~/components/extension/access-requests-card'
import { VisitHistoryCard } from '~/components/extension/visit-history-card'

export const Route = createFileRoute('/_auth/farms/$farmId/')({
  component: FarmDetailsPage,
  loader: ({ params }) => getFarmDetailsFn({ data: { farmId: params.farmId } }),
  pendingComponent: FarmDetailSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      Error loading farm details: {error.message}
    </div>
  ),
})

function FarmDetailsPage() {
  const { t } = useTranslation(['farms', 'common', 'batches', 'expenses'])
  const loaderData = Route.useLoaderData()
  const { farmId } = Route.useParams()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saleDialogOpen, setSaleDialogOpen] = useState(false)
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Info & Actions (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          <ActiveBatchesCard
            batches={activeBatches as unknown as Array<ActiveBatch>}
          />

          <StructuresCard farmId={farmId} initialStructures={structures} />

          <SensorStatusCard {...sensorSummary} />

          <AccessRequestsCard farmId={farmId} />

          <VisitHistoryCard farmId={farmId} />

          <FarmRecentActivityCard
            recentSales={recentSales as unknown as Array<RecentSale>}
            recentExpenses={recentExpenses as unknown as Array<RecentExpense>}
          />

          <FarmQuickActions
            farmId={farmId}
            onRecordSale={() => setSaleDialogOpen(true)}
            onRecordExpense={() => setExpenseDialogOpen(true)}
          />

          <FarmInfoCard farm={farm} />
        </div>

        {/* Right Column - Stats */}
        <FarmStatsSidebar stats={stats} />
      </div>

      <SaleDialog
        farmId={farmId}
        open={saleDialogOpen}
        onOpenChange={setSaleDialogOpen}
      />

      <ExpenseDialog
        farmId={farmId}
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
      />
    </div>
  )
}
