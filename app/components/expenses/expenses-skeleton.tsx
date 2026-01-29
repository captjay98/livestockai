import { Receipt } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { PageHeader } from '~/components/page-header'
import { Skeleton } from '~/components/ui/skeleton'

export function ExpensesSkeleton() {
  const { t } = useTranslation('expenses')
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        icon={Receipt}
        actions={<Skeleton className="h-10 w-32" />}
      />

      <DataTableSkeleton summaryCards={4} hasFilters hasPagination />
    </div>
  )
}
