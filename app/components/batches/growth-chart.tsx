import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation(['common'])
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['batch', batchId, 'growth-chart'],
    queryFn: () =>
      getGrowthChartDataFn({ data: { batchId, projectionDays: 14 } }),
  })

  if (isLoading) {
    return (
      <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            {t('common:growthChart', { defaultValue: 'Growth Chart' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full rounded-xl bg-muted/20" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            {t('common:growthChart', { defaultValue: 'Growth Chart' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 rounded-full bg-muted/10 mb-4 text-muted-foreground/30">
              <LineChart className="h-10 w-10" />
            </div>
            <p className="text-muted-foreground text-sm font-medium max-w-xs">
              No growth data available. Growth standards are required for this
              species.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Convert data for Recharts
  interface ChartPoint {
    day: number
    expected: string
    actual: string | null
    deviation: number | null
  }

  const formattedData: Array<ChartPoint> = chartData.map((point) => ({
    day: point.day,
    expected: (point.expectedWeightG / 1000).toFixed(2),
    actual:
      point.actualWeightG != null
        ? (point.actualWeightG / 1000).toFixed(2)
        : null,
    deviation: point.deviationPercent,
  }))

  return (
    <Card className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden relative">
      {/* Background Accent */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-12 -translate-y-12 pointer-events-none" />

      <CardHeader className="relative z-10">
        <CardTitle className="text-lg font-bold tracking-tight">
          {t('common:growthChart', { defaultValue: 'Growth Chart' })}
        </CardTitle>
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
          Comparing actual weight samples against expected growth curve
        </p>
      </CardHeader>
      <CardContent className="relative z-10">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--muted-foreground))"
              opacity={0.1}
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 10,
                fontWeight: 600,
                fill: 'hsl(var(--muted-foreground))',
              }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 10,
                fontWeight: 600,
                fill: 'hsl(var(--muted-foreground))',
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (!active || !payload || payload.length === 0) return null

                const rawData = payload[0].payload
                const day = rawData.day as number
                const expected = rawData.expected as string
                const actual = rawData.actual as string | null
                const deviation = rawData.deviation as number | null

                const date = new Date(acquisitionDate)
                date.setDate(date.getDate() + day)

                return (
                  <div className="bg-white/80 dark:bg-black/80 backdrop-blur-lg border border-white/20 dark:border-white/10 rounded-xl p-3 shadow-xl">
                    <p className="font-medium text-sm mb-2">
                      Day {day} ({format(date, 'MMM d, yyyy')})
                    </p>
                    <div className="space-y-1 text-xs">
                      <p className="text-muted-foreground">
                        Expected:{' '}
                        <span className="font-medium">{expected} kg</span>
                      </p>
                      {actual != null && (
                        <>
                          <p className="text-primary">
                            Actual:{' '}
                            <span className="font-medium">{actual} kg</span>
                          </p>
                          <p
                            className={
                              (deviation ?? 0) > 0
                                ? 'text-success'
                                : (deviation ?? 0) < 0
                                  ? 'text-destructive'
                                  : 'text-muted-foreground'
                            }
                          >
                            Deviation:{' '}
                            <span className="font-medium">
                              {deviation?.toFixed(1) ?? '0.0'}%
                            </span>
                          </p>
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
