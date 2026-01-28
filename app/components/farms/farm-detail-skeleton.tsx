import { Skeleton } from '~/components/ui/skeleton'

export function FarmDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="border rounded-lg p-4 space-y-2"
                            >
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        ))}
                    </div>

                    {/* Recent Activity */}
                    <div className="border rounded-lg p-6 space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex gap-3">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <div className="space-y-1 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Farm Info */}
                    <div className="border rounded-lg p-6 space-y-4">
                        <Skeleton className="h-6 w-24" />
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-28" />
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="border rounded-lg p-6 space-y-4">
                        <Skeleton className="h-6 w-28" />
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
