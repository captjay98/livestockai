import { DataTableSkeleton } from '~/components/ui/data-table-skeleton'

export function VaccinationsSkeleton() {
  return <DataTableSkeleton summaryCards={2} hasFilters hasPagination />
}
