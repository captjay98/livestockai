import { createFileRoute } from '@tanstack/react-router'
import { Key, Settings } from 'lucide-react'
import type { SensorType } from '~/lib/db/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { SENSOR_TYPE_CONFIG } from '~/features/sensors/constants'

interface LoaderData {
  sensors: Array<{
    id: string
    name: string
    status: string
    lastReadingAt: Date | null
  }>
}

export const Route = createFileRoute('/_auth/settings/sensors' as any)({
  loader: async (): Promise<LoaderData> => {
    const { getSensorsFn } = await import('~/features/sensors/server')
    const sensors = await getSensorsFn({ data: {} })
    return { sensors }
  },
  component: SensorSettingsPage,
})

function SensorSettingsPage() {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const { sensors } = Route.useLoaderData() as LoaderData

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Sensor Settings</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Default Thresholds</CardTitle>
            <CardDescription>
              Default alert thresholds by sensor type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              Object.entries(SENSOR_TYPE_CONFIG) as Array<
                [SensorType, (typeof SENSOR_TYPE_CONFIG)[SensorType]]
              >
            ).map(([type, config]) => (
              <div
                key={type}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{config.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {config.defaultThresholds.min} -{' '}
                    {config.defaultThresholds.max} {config.unit}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage sensor API keys and usage statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sensors.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No sensors configured
              </p>
            ) : (
              <div className="space-y-3">
                {sensors.map((sensor) => (
                  <div
                    key={sensor.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{sensor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sensor.lastReadingAt
                          ? `Last reading: ${new Date(sensor.lastReadingAt).toLocaleString()}`
                          : 'No readings yet'}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        sensor.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {sensor.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
