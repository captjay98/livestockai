import { Scale } from 'lucide-react'
import { Skeleton } from '~/components/ui/skeleton'
import { PageHeader } from '~/components/page-header'

export function WeightSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Weight Samples"
        description="Track growth by recording periodic weight samples. Compare against industry standards."
        icon={Scale}
        actions={<Skeleton className="h-10 w-32" />}
      />

      {/* Growth Alerts Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <div className="flex gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
          </div>

          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0">
              <div className="flex gap-4">
                {Array.from({ length: 5 }).map((__, j) => (
                  <Skeleton key={j} className="h-4 w-20" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  )
}
