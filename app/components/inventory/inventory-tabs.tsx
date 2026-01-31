import { Package, Pill, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/lib/utils'

type TabType = 'feed' | 'medication' | 'supplies'

interface InventoryTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  lowStockFeedCount: number
  lowStockMedCount: number
  expiredMedCount: number
  lowStockSuppliesCount?: number
  expiredSuppliesCount?: number
}

export function InventoryTabs({
  activeTab,
  onTabChange,
  lowStockFeedCount,
  lowStockMedCount,
  expiredMedCount,
  lowStockSuppliesCount = 0,
  expiredSuppliesCount = 0,
}: InventoryTabsProps) {
  const { t } = useTranslation('inventory')

  return (
    <div className="flex p-1.5 gap-2 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl w-fit">
      <Button
        variant="ghost"
        onClick={() => onTabChange('feed')}
        className={cn(
          'flex items-center gap-2 rounded-xl transition-all font-bold px-6',
          activeTab === 'feed'
            ? 'bg-white dark:bg-white/10 shadow-lg text-primary scale-[1.02]'
            : 'text-muted-foreground hover:bg-white/20 dark:hover:bg-white/5',
        )}
      >
        <Package
          className={cn(
            'h-4 w-4',
            activeTab === 'feed' ? 'text-primary' : 'text-muted-foreground/60',
          )}
        />
        {t('tabs.feed', { defaultValue: 'Feed' })}
        {lowStockFeedCount > 0 && (
          <Badge
            variant="destructive"
            className="ml-1 h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-black tracking-tighter shadow-sm"
          >
            {lowStockFeedCount}
          </Badge>
        )}
      </Button>
      <Button
        variant="ghost"
        onClick={() => onTabChange('medication')}
        className={cn(
          'flex items-center gap-2 rounded-xl transition-all font-bold px-6',
          activeTab === 'medication'
            ? 'bg-white dark:bg-white/10 shadow-lg text-primary scale-[1.02]'
            : 'text-muted-foreground hover:bg-white/20 dark:hover:bg-white/5',
        )}
      >
        <Pill
          className={cn(
            'h-4 w-4',
            activeTab === 'medication'
              ? 'text-primary'
              : 'text-muted-foreground/60',
          )}
        />
        {t('tabs.medication', { defaultValue: 'Medication' })}
        {lowStockMedCount + expiredMedCount > 0 && (
          <Badge
            variant="destructive"
            className="ml-1 h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-black tracking-tighter shadow-sm"
          >
            {lowStockMedCount + expiredMedCount}
          </Badge>
        )}
      </Button>
      <Button
        variant="ghost"
        onClick={() => onTabChange('supplies')}
        className={cn(
          'flex items-center gap-2 rounded-xl transition-all font-bold px-6',
          activeTab === 'supplies'
            ? 'bg-white dark:bg-white/10 shadow-lg text-primary scale-[1.02]'
            : 'text-muted-foreground hover:bg-white/20 dark:hover:bg-white/5',
        )}
      >
        <Wrench
          className={cn(
            'h-4 w-4',
            activeTab === 'supplies'
              ? 'text-primary'
              : 'text-muted-foreground/60',
          )}
        />
        {t('tabs.supplies', { defaultValue: 'Supplies' })}
        {lowStockSuppliesCount + expiredSuppliesCount > 0 && (
          <Badge
            variant="destructive"
            className="ml-1 h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-black tracking-tighter shadow-sm"
          >
            {lowStockSuppliesCount + expiredSuppliesCount}
          </Badge>
        )}
      </Button>
    </div>
  )
}
