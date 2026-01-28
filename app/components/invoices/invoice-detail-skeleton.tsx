import { Skeleton } from '~/components/ui/skeleton'

export function InvoiceDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Invoice Header */}
                    <div className="border rounded-lg p-6 space-y-4">
                        <div className="flex justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <div className="text-right space-y-2">
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                    </div>

                    {/* Invoice Items */}
                    <div className="border rounded-lg p-6 space-y-4">
                        <Skeleton className="h-6 w-24" />
                        <div className="space-y-3">
                            <div className="grid grid-cols-4 gap-4 pb-2 border-b">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="grid grid-cols-4 gap-4">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <div className="flex justify-between font-semibold">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-5 w-20" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="border rounded-lg p-6 space-y-4">
                        <Skeleton className="h-6 w-24" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-36" />
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="border rounded-lg p-6 space-y-4">
                        <Skeleton className="h-6 w-28" />
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
