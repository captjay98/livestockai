import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDashboard } from '~/features/dashboard/use-dashboard'
import { useDashboardPreferences, useFormatCurrency } from '~/features/settings'
import { useModules } from '~/features/modules/context'
import { Card, CardContent } from '~/components/ui/card'
import { useFarm } from '~/features/farms/context'
import {
  AlertsSection,
  DashboardDialogs,
  DashboardEmptyState,
  DashboardHeader,
  QuickActions,
  StatsCards,
} from '~/components/dashboard'
import { DashboardWelcome } from '~/components/dashboard/welcome'
import { RecentTransactionsCard } from '~/components/dashboard/recent-transactions-card'
import { DashboardTopCustomers } from '~/components/dashboard/dashboard-top-customers'
import { ActivityTimelineCard } from '~/components/dashboard/activity-timeline-card'

export const Route = createFileRoute('/_auth/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'common'])
  const { selectedFarmId } = useFarm()
  const { format: formatCurrency, symbol: currencySymbol } = useFormatCurrency()
  const { enabledModules } = useModules()
  const { cards } = useDashboardPreferences()

  const {
    stats,
    hasFarms,
    farms,
    isLoading,
    selectedFarmForEdit,
    openEditFarmDialog,
    handleAction,
    expenseDialogOpen,
    setExpenseDialogOpen,
    editFarmDialogOpen,
    setEditFarmDialogOpen,
    batchDialogOpen,
    setBatchDialogOpen,
    saleDialogOpen,
    setSaleDialogOpen,
    feedDialogOpen,
    setFeedDialogOpen,
    eggDialogOpen,
    setEggDialogOpen,
    mortalityDialogOpen,
    setMortalityDialogOpen,
  } = useDashboard(selectedFarmId)

  if (hasFarms === false) {
    return <DashboardWelcome />
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
      <DashboardHeader
        selectedFarmId={selectedFarmId}
        farms={farms}
        onEditFarm={openEditFarmDialog}
      />

      {!stats ? (
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
              <AlertsSection alerts={stats.alerts || []} />
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
