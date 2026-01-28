import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react'
import { getBatchesNeedingAttentionFn } from '~/features/batches/server'
import { useFarm } from '~/features/farms/context'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'

export function BatchesAttention() {
    const { selectedFarmId } = useFarm()

    const { data: batches, isLoading } = useQuery({
        queryKey: ['batches-attention', selectedFarmId],
        queryFn: () =>
            getBatchesNeedingAttentionFn({
                data: { farmId: selectedFarmId ?? undefined },
            }),
        enabled: !!selectedFarmId,
    })

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Batches Needing Attention
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3 border rounded-lg"
                        >
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                            <Skeleton className="h-6 w-16" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    if (!batches?.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Batches Needing Attention
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        All batches are performing well
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Batches Needing Attention
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {batches.map((batch) => (
                    <Link
                        key={batch.id}
                        to="/batches/$batchId"
                        params={{ batchId: batch.id }}
                        className="block"
                    >
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="space-y-1">
                                <div className="font-medium text-sm">
                                    {batch.batchName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {batch.species}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <div className="text-sm font-medium">
                                        PI: {batch.performanceIndex}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs">
                                        {batch.performanceIndex < 90 ? (
                                            <TrendingDown className="h-3 w-3 text-red-500" />
                                        ) : (
                                            <TrendingUp className="h-3 w-3 text-orange-500" />
                                        )}
                                        <span className="text-muted-foreground">
                                            {batch.performanceIndex < 90
                                                ? 'Low'
                                                : 'High'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    )
}
