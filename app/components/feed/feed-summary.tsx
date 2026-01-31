import { Package, TrendingUp, Wheat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFormatCurrency } from '~/features/settings'
import { SummaryCard } from '~/components/ui/summary-card'

interface FeedSummaryProps {
  summary: {
    totalQuantityKg: number
    totalCost: number
    recordCount: number
  }
  inventoryCount: number
}

export function FeedSummary({ summary, inventoryCount }: FeedSummaryProps) {
  const { t } = useTranslation(['feed', 'common'])
  const { format: formatCurrency } = useFormatCurrency()

  return (
    <>
      <SummaryCard
        title={t('feed:summaries.totalConsumed', {
          defaultValue: 'Total Consumed',
        })}
        value={`${summary.totalQuantityKg.toLocaleString()} ${t('common:units.kg', { defaultValue: 'kg' })}`}
        icon={Wheat}
        description={`${summary.recordCount} ${t('feed:summaries.records', { defaultValue: 'records' })}`}
      />

      <SummaryCard
        title={t('feed:summaries.totalCost', {
          defaultValue: 'Total Cost',
        })}
        value={formatCurrency(summary.totalCost)}
        icon={TrendingUp}
        description={t('feed:summaries.acrossBatches', {
          defaultValue: 'across all batches',
        })}
      />

      <SummaryCard
        title={t('feed:summaries.feedTypes', {
          defaultValue: 'Feed Types',
        })}
        value={inventoryCount}
        icon={Package}
        description={t('feed:summaries.inInventory', {
          defaultValue: 'in inventory',
        })}
      />
    </>
  )
}
