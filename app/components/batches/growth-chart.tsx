import { useQuery } from '@tanstack/react-query'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { getGrowthChartDataFn } from '~/features/batches/forecasting'

interface GrowthChartProps {
  batchId: string
  acquisitionDate: Date
}

export function GrowthChart({ batchId, acquisitionDate }: GrowthChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['batch', batchId, 'growth-chart'],
    queryFn: () =>
      getGrowthChartDataFn({ data: { batchId, projectionDays: 14 } }),
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Growth Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Growth Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No growth data available. Growth standards are required for this
            species.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Convert data for Recharts
  const formattedData = chartData.map((point) => ({
    day: point.day,
    expected: (point.expectedWeightG / 1000).toFixed(2),
    actual: point.actualWeightG
      ? (point.actualWeightG / 1000).toFixed(2)
      : null,
    deviation: point.deviationPercent,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth Chart</CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparing actual weight samples against expected growth curve
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              label={{
                value: 'Days from Acquisition',
                position: 'insideBottom',
                offset: -5,
              }}
            />
            <YAxis
              label={{
                value: 'Weight (kg)',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null

                const data = payload[0].payload
                const date = new Date(acquisitionDate)
                date.setDate(date.getDate() + data.day)

                return (
                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-medium text-sm mb-2">
                      Day {data.day} ({format(date, 'MMM d, yyyy')})
                    </p>
                    <div className="space-y-1 text-xs">
                      <p className="text-muted-foreground">
                        Expected:{' '}
                        <span className="font-medium">{data.expected} kg</span>
                      </p>
                      {data.actual && (
                        <>
                          <p className="text-primary">
                            Actual:{' '}
                            <span className="font-medium">
                              {data.actual} kg
                            </span>
                          </p>
                          {data.deviation !== null && (
                            <p
                              className={
                                data.deviation > 0
                                  ? 'text-success'
                                  : data.deviation < 0
                                    ? 'text-destructive'
                                    : 'text-muted-foreground'
                              }
                            >
                              Deviation:{' '}
                              <span className="font-medium">
                                {data.deviation.toFixed(1)}%
                              </span>
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              }}
            />
            <Legend />

            {/* Deviation zones (±10%) */}
            <ReferenceLine y={0} stroke="transparent" strokeDasharray="3 3" />

            {/* Expected growth curve */}
            <Line
              type="monotone"
              dataKey="expected"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Expected Weight"
            />

            {/* Actual weight samples */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              connectNulls={false}
              name="Actual Weight"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-muted-foreground" />
            <span>Expected Growth</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-primary" />
            <span>Actual Weight</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
