import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export function FeedSkeleton() {
  return <DataTableSkeleton summaryCards={3} hasFilters hasPagination />
}
