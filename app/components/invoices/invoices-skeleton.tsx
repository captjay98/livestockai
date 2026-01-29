import { Skeleton } from '~/components/ui/skeleton'

export function InvoicesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Data table skeleton */}
      <div className="space-y-4">
        {/* Filters and search */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Table header */}
        <Skeleton className="h-12 w-full" />

        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
      </div>
    </div>
  )
}
