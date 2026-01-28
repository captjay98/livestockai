import { Syringe } from 'lucide-react'
import { PageHeader } from '~/components/page-header'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'

export function VaccinationsSkeleton() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Vaccinations & Treatments"
                description="Track health interventions for your livestock"
                icon={Syringe}
                actions={
                    <div className="flex gap-2">
                        <Button disabled>
                            <Skeleton className="h-4 w-4 mr-2" />
                            Vaccinate
                        </Button>
                        <Button disabled>
                            <Skeleton className="h-4 w-4 mr-2" />
                            Treat
                        </Button>
                    </div>
                }
            />

            <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-6 w-16" />
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>

                <div className="border rounded-lg">
                    <div className="p-4 border-b">
                        <Skeleton className="h-4 w-full" />
                    </div>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-4 border-b last:border-b-0">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
