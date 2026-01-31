import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export function SensorsSkeleton() {
  return <DataTableSkeleton summaryCards={2} hasFilters hasPagination />
}
