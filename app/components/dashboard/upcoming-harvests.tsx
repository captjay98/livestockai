import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { getUpcomingHarvestsFn } from '~/features/batches/forecasting'
import { useFarm } from '~/features/farms/context'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'

export function UpcomingHarvests() {
  const { selectedFarmId } = useFarm()

  const { data: harvests, isLoading } = useQuery({
    queryKey: ['upcoming-harvests', selectedFarmId],
    queryFn: () =>
      getUpcomingHarvestsFn({
        data: { farmId: selectedFarmId ?? undefined, daysAhead: 14 },
      }),
    enabled: !!selectedFarmId,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Harvests
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

  if (!harvests?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Harvests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No harvests scheduled in the next 14 days
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Harvests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {harvests.map((batch) => (
          <Link
            key={batch.id}
            to="/batches/$batchId"
            params={{ batchId: batch.id }}
            className="block"
          >
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="font-medium text-sm truncate">
                  {batch.batchName}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {batch.species} • {batch.currentQuantity} birds
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-medium">
                  {batch.projectedHarvestDate
                    ? format(new Date(batch.projectedHarvestDate), 'MMM d')
                    : '--'}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {batch.daysRemaining === 0
                      ? 'Today'
                      : batch.daysRemaining === 1
                        ? '1 day'
                        : `${batch.daysRemaining} days`}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
