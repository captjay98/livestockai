import { Package, Pill } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

type TabType = 'feed' | 'medication'

interface InventoryTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  lowStockFeedCount: number
  lowStockMedCount: number
  expiredMedCount: number
}

export function InventoryTabs({
  activeTab,
  onTabChange,
  lowStockFeedCount,
  lowStockMedCount,
  expiredMedCount,
}: InventoryTabsProps) {
  const { t } = useTranslation('inventory')

  return (
    <div className="flex gap-2">
      <Button
        variant={activeTab === 'feed' ? 'default' : 'outline'}
        onClick={() => onTabChange('feed')}
        className="flex items-center gap-2"
      >
        <Package className="h-4 w-4" />
        {t('tabs.feed', { defaultValue: 'Feed Inventory' })}
        {lowStockFeedCount > 0 && (
          <Badge
            variant="destructive"
            className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {lowStockFeedCount}
          </Badge>
        )}
      </Button>
      <Button
        variant={activeTab === 'medication' ? 'default' : 'outline'}
        onClick={() => onTabChange('medication')}
        className="flex items-center gap-2"
      >
        <Pill className="h-4 w-4" />
        {t('tabs.medication', { defaultValue: 'Medication Inventory' })}
        {lowStockMedCount + expiredMedCount > 0 && (
          <Badge
            variant="destructive"
            className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {lowStockMedCount + expiredMedCount}
          </Badge>
        )}
      </Button>
    </div>
  )
}
