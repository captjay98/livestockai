import { Receipt } from 'lucide-react'
import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'
import { PageHeader } from '~/components/page-header'
import { Skeleton } from '~/components/ui/skeleton'

export function ExpensesSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and categorize farm expenses"
        icon={Receipt}
        actions={<Skeleton className="h-10 w-32" />}
      />

      <DataTableSkeleton summaryCards={4} hasFilters hasPagination />
    </div>
  )
}
