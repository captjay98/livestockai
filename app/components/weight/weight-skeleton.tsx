import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export function WeightSkeleton() {
  return <DataTableSkeleton summaryCards={3} hasFilters hasPagination />
}
