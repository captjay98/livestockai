import { Rocket } from 'lucide-react'
import { Skeleton } from '~/components/ui/skeleton'
import { PageHeader } from '~/components/page-header'

export function OnboardingSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome to LivestockAI"
        description="Let's get your farm set up in just a few steps."
        icon={Rocket}
      />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        {/* Step Content */}
        <div className="border rounded-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Steps Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
