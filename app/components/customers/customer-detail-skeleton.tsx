import { Skeleton } from '~/components/ui/skeleton'

export function CustomerDetailSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            {/* Command center skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>

            {/* KPIs skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
            </div>

            {/* Tabs skeleton */}
            <div className="space-y-4">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-16" />
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-16" />
                </div>
                <Skeleton className="h-64" />
            </div>
        </div>
    )
}
