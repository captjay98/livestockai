import { Wheat } from 'lucide-react'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { PageHeader } from '~/components/page-header'
import { Skeleton } from '~/components/ui/skeleton'

export function FeedSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Feed Records"
        description="Track feed consumption and costs"
        icon={Wheat}
        actions={<Skeleton className="h-10 w-32" />}
      />

      <DataTableSkeleton summaryCards={4} hasFilters hasPagination />
    </div>
  )
}
