import { Skeleton } from '~/components/ui/skeleton'

interface DataTableSkeletonProps {
  summaryCards?: number
  hasFilters?: boolean
  hasPagination?: boolean
}

export function DataTableSkeleton({
  summaryCards = 4,
  hasFilters = true,
  hasPagination = true,
}: DataTableSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Summary cards skeleton */}
      {summaryCards > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: summaryCards }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {/* Data table skeleton */}
      <div className="space-y-4">
        {/* Filters and search */}
        {hasFilters && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
        )}

        {/* Table header */}
        <Skeleton className="h-12 w-full" />

        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}

        {/* Pagination */}
        {hasPagination && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-64" />
          </div>
        )}
      </div>
    </div>
  )
}
