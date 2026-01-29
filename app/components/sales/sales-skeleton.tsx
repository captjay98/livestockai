import { Receipt } from 'lucide-react'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { PageHeader } from '~/components/page-header'
import { Skeleton } from '~/components/ui/skeleton'

export function SalesSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="Record and track livestock sales transactions"
        icon={Receipt}
        actions={<Skeleton className="h-10 w-24" />}
      />

      <DataTableSkeleton summaryCards={4} hasFilters hasPagination />
    </div>
  )
}
