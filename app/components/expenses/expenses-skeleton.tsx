import { Receipt } from 'lucide-react'
import { Skeleton } from '~/components/ui/skeleton'
import { PageHeader } from '~/components/page-header'

export function ExpensesSkeleton() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Expenses"
                description="Track and categorize farm expenses"
                icon={Receipt}
                actions={<Skeleton className="h-10 w-32" />}
            />

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-6">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                ))}
            </div>

            {/* Data Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>

                <div className="rounded-md border">
                    <div className="p-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center space-x-4 py-3"
                            >
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
