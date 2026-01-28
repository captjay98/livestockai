import { Activity, Droplets, Gauge, Thermometer, Wind } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer } from 'recharts'
import type { SensorType } from '~/lib/db/types'
import { Card, CardContent } from '~/components/ui/card'
import { SENSOR_TYPE_CONFIG } from '~/features/sensors/constants'

interface SensorWithStatus {
    id: string
    name: string
    sensorType: SensorType
    status: 'online' | 'stale' | 'offline'
    latestValue: number | null
    structureName: string | null
}

interface SensorCardProps {
    sensor: SensorWithStatus
    latestReading?: {
        value: number
        recordedAt: Date
    }
    readings?: Array<{ value: number; recordedAt: Date }>
}

const SENSOR_ICONS = {
    temperature: Thermometer,
    humidity: Droplets,
    ph: Activity,
    dissolved_oxygen: Wind,
    ammonia: Gauge,
} as const

const STATUS_COLORS = {
    online: 'bg-green-500',
    stale: 'bg-yellow-500',
    offline: 'bg-red-500',
}

const STROKE_COLORS = {
    online: '#22c55e',
    stale: '#eab308',
    offline: '#ef4444',
}

function formatTimeAgo(date: Date): string {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

export function SensorCard({
    sensor,
    latestReading,
    readings,
}: SensorCardProps) {
    const iconKey = sensor.sensorType as keyof typeof SENSOR_ICONS
    const Icon = iconKey in SENSOR_ICONS ? SENSOR_ICONS[iconKey] : Activity
    const config = SENSOR_TYPE_CONFIG[sensor.sensorType]
    const value = latestReading?.value ?? sensor.latestValue
    const lastReading = latestReading?.recordedAt

    const chartData =
        readings?.map((r) => ({
            value: r.value,
            time: r.recordedAt.getTime(),
        })) || []
    const minValue = chartData.length
        ? Math.min(...chartData.map((d) => d.value))
        : 0
    const maxValue = chartData.length
        ? Math.max(...chartData.map((d) => d.value))
        : 0

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                            {sensor.name}
                        </span>
                    </div>
                    <div
                        className={`w-2 h-2 rounded-full ${STATUS_COLORS[sensor.status]}`}
                    />
                </div>

                <div className="mb-2">
                    <span className="text-2xl font-bold">
                        {value != null ? value.toFixed(1) : '--'}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                        {config.unit}
                    </span>
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                    {lastReading
                        ? formatTimeAgo(lastReading)
                        : 'No recent data'}
                </div>

                <div className="h-8">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={32}>
                            <LineChart data={chartData}>
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={STROKE_COLORS[sensor.status]}
                                    strokeWidth={2}
                                    dot={(props) => {
                                        const { payload } = props
                                        if (
                                            payload.value === minValue ||
                                            payload.value === maxValue
                                        ) {
                                            return (
                                                <circle
                                                    cx={props.cx}
                                                    cy={props.cy}
                                                    r={2}
                                                    fill={
                                                        STROKE_COLORS[
                                                            sensor.status
                                                        ]
                                                    }
                                                />
                                            )
                                        }
                                        return null
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-8 bg-muted/20 rounded flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">
                                No data
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
