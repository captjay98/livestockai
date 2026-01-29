import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export function BatchesSkeleton() {
  return <DataTableSkeleton summaryCards={4} hasFilters hasPagination />
}
