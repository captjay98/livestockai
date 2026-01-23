import { createFileRoute } from '@tanstack/react-router'
import { Warehouse } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormatWeight } from '~/features/settings'
import { useFarm } from '~/features/farms/context'
import { useFeedInventory } from '~/features/inventory/use-feed-inventory'
import { useMedicationInventory } from '~/features/inventory/use-medication-inventory'
import { PageHeader } from '~/components/page-header'
import { FeedInventoryTable } from '~/components/inventory/feed-inventory-table'
import { MedicationInventoryTable } from '~/components/inventory/medication-inventory-table'
import { InventoryAlerts } from '~/components/inventory/inventory-alerts'
import { InventoryTabs } from '~/components/inventory/inventory-tabs'

export const Route = createFileRoute('/_auth/inventory/')({
  component: InventoryPage,
})

type TabType = 'feed' | 'medication'

function InventoryPage() {
  const { t } = useTranslation(['inventory', 'common'])
  const { format: formatWeight } = useFormatWeight()
  const { selectedFarmId } = useFarm()
  const [activeTab, setActiveTab] = useState<TabType>('feed')

  const {
    feedInventory,
    isLoading: feedLoading,
    isSubmitting: feedSubmitting,
    lowStockCount: lowStockFeedCount,
    refetch: _refetchFeed,
    createFeed,
    updateFeed,
    deleteFeed,
  } = useFeedInventory(selectedFarmId)

  const {
    medicationInventory,
    isLoading: medLoading,
    isSubmitting: medSubmitting,
    lowStockCount: lowStockMedCount,
    expiringCount: expiringMedCount,
    expiredCount: expiredMedCount,
    refetch: _refetchMedication,
    createMedication,
    updateMedication,
    deleteMedication,
  } = useMedicationInventory(selectedFarmId)

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
          items={feedInventory}
          isLoading={feedLoading}
          isSubmitting={feedSubmitting}
          formatWeight={formatWeight}
          onCreateFeed={createFeed}
          onUpdateFeed={updateFeed}
          onDeleteFeed={deleteFeed}
        />
      )}

      {activeTab === 'medication' && (
        <MedicationInventoryTable
          items={medicationInventory}
          isLoading={medLoading}
          isSubmitting={medSubmitting}
          onCreateMedication={createMedication}
          onUpdateMedication={updateMedication}
          onDeleteMedication={deleteMedication}
        />
      )}
    </div>
  )
}
