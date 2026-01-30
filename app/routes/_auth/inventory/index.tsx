import { createFileRoute } from '@tanstack/react-router'
import { Warehouse } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormatWeight } from '~/features/settings'
import { useFarm } from '~/features/farms/context'
import { getFeedInventoryFn } from '~/features/inventory/feed-server'
import { getMedicationInventoryFn } from '~/features/inventory/medication-server'
import { getSuppliesInventoryFn } from '~/features/inventory/supplies-server'
import { getRecentFeedConsumptionFn } from '~/features/feed/server'
import { getRecentMedicationUsageFn } from '~/features/vaccinations/server'
import { useFeedInventory } from '~/features/inventory/use-feed-inventory'
import { useMedicationInventory } from '~/features/inventory/use-medication-inventory'
import { useSuppliesInventory } from '~/features/inventory/use-supplies-inventory'
import { PageHeader } from '~/components/page-header'
import { FeedInventoryTable } from '~/components/inventory/feed-inventory-table'
import { MedicationInventoryTable } from '~/components/inventory/medication-inventory-table'
import { SuppliesInventoryTable } from '~/components/inventory/supplies-inventory-table'
import { InventoryAlerts } from '~/components/inventory/inventory-alerts'
import { InventoryTabs } from '~/components/inventory/inventory-tabs'
import { InventorySkeleton } from '~/components/inventory/inventory-skeleton'
import { RecentFeedConsumption } from '~/components/inventory/recent-feed-consumption'
import { RecentMedicationUsage } from '~/components/inventory/recent-medication-usage'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/inventory/')({
  loader: async () => {
    const [
      feedInventory,
      medicationInventory,
      suppliesInventory,
      recentFeedConsumption,
      recentMedicationUsage,
    ] = await Promise.all([
      getFeedInventoryFn({ data: {} }),
      getMedicationInventoryFn({ data: {} }),
      getSuppliesInventoryFn({ data: {} }),
      getRecentFeedConsumptionFn({ data: { days: 7 } }),
      getRecentMedicationUsageFn({ data: { days: 7 } }),
    ])

    return {
      feedInventory,
      medicationInventory,
      suppliesInventory,
      recentFeedConsumption,
      recentMedicationUsage,
    }
  },
  pendingComponent: InventorySkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: InventoryPage,
})

type TabType = 'feed' | 'medication' | 'supplies'

interface FeedInventoryItem {
  id: string
  feedType: string
  quantityKg: string
  minThresholdKg: string
  costPerKg?: string
  supplier?: string
  lastRestocked?: Date | string
}

interface MedicationInventoryItem {
  id: string
  medicationName: string
  quantity: number
  unit: string
  minThreshold: number
  expiryDate?: Date | string | null | undefined
  cost?: string
  supplier?: string
}

interface SuppliesInventoryItem {
  id: string
  itemName: string
  category: string
  quantityKg: string
  unit: string
  minThresholdKg: string
  expiryDate?: Date | string | null | undefined
}

function InventoryPage() {
  const { t } = useTranslation(['inventory', 'common'])
  const { format: formatWeight } = useFormatWeight()
  const { selectedFarmId } = useFarm()
  const [activeTab, setActiveTab] = useState<TabType>('feed')

  // Get data from loader
  const {
    feedInventory: feedData,
    medicationInventory: medicationData,
    suppliesInventory: suppliesData,
    recentFeedConsumption,
    recentMedicationUsage,
  } = Route.useLoaderData()

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

  const {
    isSubmitting: suppliesSubmitting,
    createSupply,
    updateSupply,
    deleteSupply,
    addStock,
    reduceStock,
  } = useSuppliesInventory()

  // Calculate counts from loader data
  const lowStockFeedCount = (feedData as Array<FeedInventoryItem>).filter(
    (f) => parseFloat(f.quantityKg) <= parseFloat(f.minThresholdKg),
  ).length

  const isExpiringSoon = (date: Date | string | null | undefined) => {
    if (!date) return false
    const d = new Date(date)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return d <= thirtyDaysFromNow
  }

  const isExpired = (date: Date | string | null | undefined) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  const lowStockMedCount = (
    medicationData as Array<MedicationInventoryItem>
  ).filter((m) => m.quantity <= m.minThreshold).length

  const expiringMedCount = (
    medicationData as Array<MedicationInventoryItem>
  ).filter(
    (m) => isExpiringSoon(m.expiryDate) && !isExpired(m.expiryDate),
  ).length

  const expiredMedCount = (
    medicationData as Array<MedicationInventoryItem>
  ).filter((m) => isExpired(m.expiryDate)).length

  const lowStockSuppliesCount = (
    suppliesData as Array<SuppliesInventoryItem>
  ).filter(
    (s) => parseFloat(s.quantityKg) <= parseFloat(s.minThresholdKg),
  ).length

  const expiringSuppliesCount = (
    suppliesData as Array<SuppliesInventoryItem>
  ).filter(
    (s) => isExpiringSoon(s.expiryDate) && !isExpired(s.expiryDate),
  ).length

  const expiredSuppliesCount = (
    suppliesData as Array<SuppliesInventoryItem>
  ).filter((s) => isExpired(s.expiryDate)).length

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('inventory:title', { defaultValue: 'Inventory' })}
        description={t('inventory:subtitle', {
          defaultValue: 'Manage feed, medication, and supplies stock levels',
        })}
        icon={Warehouse}
      />

      <InventoryAlerts
        lowStockFeedCount={lowStockFeedCount}
        lowStockMedCount={lowStockMedCount}
        expiringMedCount={expiringMedCount}
        expiredMedCount={expiredMedCount}
        lowStockSuppliesCount={lowStockSuppliesCount}
        expiringSuppliesCount={expiringSuppliesCount}
        expiredSuppliesCount={expiredSuppliesCount}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentFeedConsumption consumption={recentFeedConsumption} days={7} />
        <RecentMedicationUsage usage={recentMedicationUsage} days={7} />
      </div>

      <InventoryTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lowStockFeedCount={lowStockFeedCount}
        lowStockMedCount={lowStockMedCount}
        expiredMedCount={expiredMedCount}
        lowStockSuppliesCount={lowStockSuppliesCount}
        expiredSuppliesCount={expiredSuppliesCount}
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

      {activeTab === 'supplies' && (
        <SuppliesInventoryTable
          items={suppliesData}
          isLoading={false}
          isSubmitting={suppliesSubmitting}
          onCreateSupply={createSupply}
          onUpdateSupply={updateSupply}
          onDeleteSupply={deleteSupply}
          onAddStock={addStock}
          onReduceStock={reduceStock}
        />
      )}
    </div>
  )
}
