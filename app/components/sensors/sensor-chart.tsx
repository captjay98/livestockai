import { useEffect, useState } from 'react'
import { format, subHours } from 'date-fns'
import {
  Bar,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SensorType } from '~/features/sensors/types'
import {
  getMortalityForChartFn,
  getSensorChartDataFn,
} from '~/features/sensors/server'
import { SENSOR_TYPE_CONFIG } from '~/features/sensors/constants'

interface SensorChartProps {
  sensorId: string
  sensorType: SensorType
  structureId?: string | null
  showMortality?: boolean
}

const TIME_RANGES = [
  { value: '24h', label: '24h', hours: 24 },
  { value: '7d', label: '7d', hours: 24 * 7 },
  { value: '30d', label: '30d', hours: 24 * 30 },
  { value: '90d', label: '90d', hours: 24 * 90 },
] as const

type TimeRange = (typeof TIME_RANGES)[number]['value']

export function SensorChart({
  sensorId,
  sensorType,
  structureId,
  showMortality = false,
}: SensorChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [data, setData] = useState<
    Array<{ timestamp: string; value: number; mortality?: number }>
  >([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const range = TIME_RANGES.find((r) => r.value === timeRange)
        const endDate = new Date()
        const startDate = subHours(endDate, range?.hours ?? 24)

        const [sensorData, mortalityData] = await Promise.all([
          getSensorChartDataFn({
            data: { sensorId, startDate, endDate },
          }),
          showMortality && structureId
            ? getMortalityForChartFn({
                data: { structureId, startDate, endDate },
              })
            : Promise.resolve([]),
        ])

        // Create mortality lookup by date
        const mortalityByDate = new Map<string, number>()
        for (const m of mortalityData) {
          const dateKey = format(new Date(m.date), 'yyyy-MM-dd')
          mortalityByDate.set(
            dateKey,
            (mortalityByDate.get(dateKey) ?? 0) + m.quantity,
          )
        }

        setData(
          sensorData.map((r) => {
            const dateKey = format(new Date(r.recordedAt), 'yyyy-MM-dd')
            return {
              timestamp: new Date(r.recordedAt).toISOString(),
              value: r.value,
              mortality: mortalityByDate.get(dateKey),
            }
          }),
        )
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sensorId, timeRange, structureId, showMortality])

  const config = SENSOR_TYPE_CONFIG[sensorType]
  const thresholds = config.defaultThresholds
  const hasMortalityData = data.some((d) => d.mortality !== undefined)

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-muted-foreground">No data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {TIME_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => setTimeRange(range.value)}
            className={`px-3 py-1 text-sm rounded ${
              timeRange === range.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={(v) => format(new Date(v), 'HH:mm')}
            />
            <YAxis
              yAxisId="sensor"
              label={{
                value: config.unit,
                angle: -90,
                position: 'insideLeft',
              }}
            />
            {hasMortalityData && (
              <YAxis
                yAxisId="mortality"
                orientation="right"
                label={{
                  value: 'Deaths',
                  angle: 90,
                  position: 'insideRight',
                }}
              />
            )}
            <Tooltip
              labelFormatter={(v) =>
                format(new Date(v as string), 'MMM dd, HH:mm')
              }
              formatter={(v, name) => {
                if (name === 'mortality') return [`${v} deaths`, 'Mortality']
                return [`${v} ${config.unit}`, 'Value']
              }}
            />
            {hasMortalityData && <Legend />}
            <Line
              yAxisId="sensor"
              type="monotone"
              dataKey="value"
              name="Sensor"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
            {hasMortalityData && (
              <Bar
                yAxisId="mortality"
                dataKey="mortality"
                name="Mortality"
                fill="hsl(var(--destructive))"
                opacity={0.5}
              />
            )}
            <ReferenceLine
              yAxisId="sensor"
              y={thresholds.min}
              stroke="hsl(var(--destructive))"
              strokeDasharray="5 5"
            />
            <ReferenceLine
              yAxisId="sensor"
              y={thresholds.max}
              stroke="hsl(var(--destructive))"
              strokeDasharray="5 5"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
