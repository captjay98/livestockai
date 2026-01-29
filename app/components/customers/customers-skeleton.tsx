import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export function CustomersSkeleton() {
  return <DataTableSkeleton summaryCards={4} hasFilters hasPagination />
}
