import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export function WaterQualitySkeleton() {
  return <DataTableSkeleton summaryCards={4} hasFilters hasPagination />
}
