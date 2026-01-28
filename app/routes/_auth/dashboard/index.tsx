import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import type { DashboardAction, DashboardFarm } from '~/features/dashboard/types'
import { getDashboardDataFn } from '~/features/dashboard/server'
import { useDashboardPreferences, useFormatCurrency } from '~/features/settings'
import { useModules } from '~/features/modules/context'
import { Card, CardContent } from '~/components/ui/card'
import { useFarm } from '~/features/farms/context'
import { useSession } from '~/features/auth/client'
import {
  AlertsSection,
  DashboardDialogs,
  DashboardEmptyState,
  DashboardHeader,
  QuickActions,
  StatsCards,
} from '~/components/dashboard'
import { BatchesAttention } from '~/components/dashboard/batches-attention'
import { UpcomingHarvests } from '~/components/dashboard/upcoming-harvests'
import { DashboardWelcome } from '~/components/dashboard/welcome'
import { RecentTransactionsCard } from '~/components/dashboard/recent-transactions-card'
import { DashboardTopCustomers } from '~/components/dashboard/dashboard-top-customers'
import { ActivityTimelineCard } from '~/components/dashboard/activity-timeline-card'
import { DashboardSkeleton } from '~/components/dashboard/dashboard-skeleton'
import { SensorStatusCard } from '~/components/sensors/sensor-status-card'

export const Route = createFileRoute('/_auth/dashboard/')({
  component: DashboardPage,
  pendingComponent: DashboardSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-6 text-center">
      <p className="text-destructive">
        Failed to load dashboard: {error.message}
      </p>
    </div>
  ),
  loader: async () => {
    return getDashboardDataFn()
  },
})

function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'common'])
  const { selectedFarmId } = useFarm()
  const { format: formatCurrency, symbol: currencySymbol } = useFormatCurrency()
  const { enabledModules } = useModules()
  const { cards } = useDashboardPreferences()
  const { stats, hasFarms, farms, sensorSummary } = Route.useLoaderData()
  const { data: session } = useSession()

  // Dialog states
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editFarmDialogOpen, setEditFarmDialogOpen] = useState(false)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [saleDialogOpen, setSaleDialogOpen] = useState(false)
  const [feedDialogOpen, setFeedDialogOpen] = useState(false)
  const [eggDialogOpen, setEggDialogOpen] = useState(false)
  const [mortalityDialogOpen, setMortalityDialogOpen] = useState(false)
  const [selectedFarmForEdit, setSelectedFarmForEdit] =
    useState<DashboardFarm | null>(null)

  const openEditFarmDialog = (farm: DashboardFarm) => {
    setSelectedFarmForEdit(farm)
    setEditFarmDialogOpen(true)
  }

  const handleAction = (action: DashboardAction) => {
    if (!selectedFarmId) return
    switch (action) {
      case 'batch':
        setBatchDialogOpen(true)
        break
      case 'feed':
        setFeedDialogOpen(true)
        break
      case 'expense':
        setExpenseDialogOpen(true)
        break
      case 'sale':
        setSaleDialogOpen(true)
        break
      case 'mortality':
        setMortalityDialogOpen(true)
        break
    }
  }

  if (hasFarms === false) {
    return <DashboardWelcome />
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        selectedFarmId={selectedFarmId}
        farms={farms}
        onEditFarm={openEditFarmDialog}
      />

      {stats.inventory.activeBatches === 0 ? (
        <DashboardEmptyState
          selectedFarmId={selectedFarmId}
          onCreateBatch={() => setBatchDialogOpen(true)}
        />
      ) : (
        <>
          <StatsCards
            stats={stats}
            cards={cards}
            enabledModules={enabledModules}
            currencySymbol={currencySymbol}
            formatCurrency={formatCurrency}
          />

          {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
          {session?.user?.id ? (
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <BatchesAttention />
              <UpcomingHarvests />
            </div>
          ) : null}

          {sensorSummary && sensorSummary.totalSensors > 0 && (
            <SensorStatusCard
              totalSensors={sensorSummary.totalSensors}
              activeSensors={sensorSummary.activeSensors}
              inactiveSensors={sensorSummary.inactiveSensors}
              alertCount={sensorSummary.alertCount}
            />
          )}

          {!cards.revenue &&
            !cards.expenses &&
            !cards.profit &&
            !cards.inventory &&
            !cards.mortality &&
            !cards.feed && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {t('allCardsHidden', {
                      defaultValue: 'All dashboard cards are hidden.',
                    })}{' '}
                    <Link
                      to="/settings"
                      className="text-primary hover:underline"
                    >
                      {t('customize', { defaultValue: 'Customize dashboard' })}
                    </Link>
                  </p>
                </CardContent>
              </Card>
            )}

          <QuickActions
            selectedFarmId={selectedFarmId}
            onAction={handleAction}
          />

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <AlertsSection alerts={stats.alerts} />
              <RecentTransactionsCard transactions={stats.recentTransactions} />
            </div>

            <div className="space-y-4 sm:space-y-6">
              <DashboardTopCustomers customers={stats.topCustomers} />
              <ActivityTimelineCard />
            </div>
          </div>
        </>
      )}

      <DashboardDialogs
        selectedFarmId={selectedFarmId}
        selectedFarmForEdit={selectedFarmForEdit}
        expenseDialogOpen={expenseDialogOpen}
        setExpenseDialogOpen={setExpenseDialogOpen}
        editFarmDialogOpen={editFarmDialogOpen}
        setEditFarmDialogOpen={setEditFarmDialogOpen}
        batchDialogOpen={batchDialogOpen}
        setBatchDialogOpen={setBatchDialogOpen}
        saleDialogOpen={saleDialogOpen}
        setSaleDialogOpen={setSaleDialogOpen}
        feedDialogOpen={feedDialogOpen}
        setFeedDialogOpen={setFeedDialogOpen}
        eggDialogOpen={eggDialogOpen}
        setEggDialogOpen={setEggDialogOpen}
        mortalityDialogOpen={mortalityDialogOpen}
        setMortalityDialogOpen={setMortalityDialogOpen}
      />
    </div>
  )
}
