import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActiveBatch } from '~/components/farms/active-batches-card'
import type {
  RecentExpense,
  RecentSale,
} from '~/components/farms/farm-recent-activity-card'
import { getFarmById, getFarmStats } from '~/features/farms/server'
import { getStructuresWithCounts } from '~/features/structures/server'
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

const getFarmDetails = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('~/features/auth/server-middleware')
      const session = await requireAuth()

      // Dynamically import backend functions to avoid server-code leakage
      const { getBatches } = await import('~/features/batches/server')
      const { getSalesForFarm } = await import('~/features/sales/server')
      const { getExpensesForFarm } = await import('~/features/expenses/server')

      const [
        farm,
        stats,
        activeBatches,
        recentSales,
        recentExpenses,
        structures,
      ] = await Promise.all([
        getFarmById(data.farmId, session.user.id),
        getFarmStats(data.farmId, session.user.id),
        getBatches(session.user.id, data.farmId, { status: 'active' }),
        getSalesForFarm(session.user.id, data.farmId),
        getExpensesForFarm(session.user.id, data.farmId),
        getStructuresWithCounts(session.user.id, data.farmId),
      ])
      return {
        farm,
        stats,
        activeBatches,
        recentSales,
        recentExpenses,
        structures,
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/_auth/farms/$farmId/')({
  component: FarmDetailsPage,
  loader: ({ params }) => getFarmDetails({ data: { farmId: params.farmId } }),
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
