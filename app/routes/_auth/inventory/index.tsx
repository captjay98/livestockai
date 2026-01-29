import { createFileRoute } from '@tanstack/react-router'
import { Warehouse } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormatWeight } from '~/features/settings'
import { useFarm } from '~/features/farms/context'
import { getFeedInventoryFn } from '~/features/inventory/feed-server'
import { getMedicationInventoryFn } from '~/features/inventory/medication-server'
import { useFeedInventory } from '~/features/inventory/use-feed-inventory'
import { useMedicationInventory } from '~/features/inventory/use-medication-inventory'
import { PageHeader } from '~/components/page-header'
import { FeedInventoryTable } from '~/components/inventory/feed-inventory-table'
import { MedicationInventoryTable } from '~/components/inventory/medication-inventory-table'
import { InventoryAlerts } from '~/components/inventory/inventory-alerts'
import { InventoryTabs } from '~/components/inventory/inventory-tabs'
import { InventorySkeleton } from '~/components/inventory/inventory-skeleton'

export const Route = createFileRoute('/_auth/inventory/')({
  loader: async () => {
    const [feedInventory, medicationInventory] = await Promise.all([
      getFeedInventoryFn({ data: {} }),
      getMedicationInventoryFn({ data: {} }),
    ])

    return {
      feedInventory,
      medicationInventory,
    }
  },
  pendingComponent: InventorySkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      Error loading inventory: {error.message}
    </div>
  ),
  component: InventoryPage,
})

type TabType = 'feed' | 'medication'

function InventoryPage() {
  const { t } = useTranslation(['inventory', 'common'])
  const { format: formatWeight } = useFormatWeight()
  const { selectedFarmId } = useFarm()
  const [activeTab, setActiveTab] = useState<TabType>('feed')

  // Get data from loader
  const { feedInventory: feedData, medicationInventory: medicationData } =
    Route.useLoaderData()

  const {
    isSubmitting: feedSubmitting,
    createFeed,
    updateFeed,
    deleteFeed,
  } = useFeedInventory(selectedFarmId)

  const {
    isSubmitting: medSubmitting,
    createMedication,
    updateMedication,
    deleteMedication,
  } = useMedicationInventory(selectedFarmId)

  // Calculate counts from loader data
  const lowStockFeedCount = feedData.filter(
    (f) => parseFloat(f.quantityKg) <= parseFloat(f.minThresholdKg),
  ).length

  const isExpiringSoon = (date: Date | string | null) => {
    if (!date) return false
    const d = new Date(date)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return d <= thirtyDaysFromNow
  }

  const isExpired = (date: Date | string | null) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  const lowStockMedCount = medicationData.filter(
    (m) => m.quantity <= m.minThreshold,
  ).length

  const expiringMedCount = medicationData.filter(
    (m) => isExpiringSoon(m.expiryDate) && !isExpired(m.expiryDate),
  ).length

  const expiredMedCount = medicationData.filter((m) =>
    isExpired(m.expiryDate),
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('inventory:title', { defaultValue: 'Inventory' })}
        description={t('inventory:subtitle', {
          defaultValue: 'Manage feed and medication stock levels',
        })}
        icon={Warehouse}
      />

      <InventoryAlerts
        lowStockFeedCount={lowStockFeedCount}
        lowStockMedCount={lowStockMedCount}
        expiringMedCount={expiringMedCount}
        expiredMedCount={expiredMedCount}
      />

      <InventoryTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lowStockFeedCount={lowStockFeedCount}
        lowStockMedCount={lowStockMedCount}
        expiredMedCount={expiredMedCount}
      />

      {activeTab === 'feed' && (
        <FeedInventoryTable
          items={feedData}
          isLoading={false}
          isSubmitting={feedSubmitting}
          formatWeight={formatWeight}
          onCreateFeed={createFeed}
          onUpdateFeed={updateFeed}
          onDeleteFeed={deleteFeed}
        />
      )}

      {activeTab === 'medication' && (
        <MedicationInventoryTable
          items={medicationData}
          isLoading={false}
          isSubmitting={medSubmitting}
          onCreateMedication={createMedication}
          onUpdateMedication={updateMedication}
          onDeleteMedication={deleteMedication}
        />
      )}
    </div>
  )
}
