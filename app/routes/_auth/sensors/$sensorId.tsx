import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { SensorCard } from '~/components/sensors/sensor-card'
import { SensorFormDialog } from '~/components/sensors/sensor-form-dialog'
import { AlertHistory } from '~/components/sensors/alert-history'
import { SensorChart } from '~/components/sensors/sensor-chart'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import {
    acknowledgeAlertFn,
    deleteSensorFn,
    getSensorChartDataFn,
    getSensorFn,
    updateSensorFn,
} from '~/features/sensors/server'

export const Route = createFileRoute('/_auth/sensors/$sensorId' as any)({
    loader: async ({ params }: { params: { sensorId: string } }) => {
        const sensor = await getSensorFn({
            data: { sensorId: params.sensorId },
        })
        const now = new Date()
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const readings = await getSensorChartDataFn({
            data: {
                sensorId: params.sensorId,
                startDate: dayAgo,
                endDate: now,
            },
        })
        return { sensor, readings, alerts: [] as Array<any> }
    },
    component: SensorDetailPage,
})

function SensorDetailPage() {
    const data = Route.useLoaderData()
    const { sensor, readings, alerts } = data
    const params = Route.useParams()
    const { sensorId } = params
    const navigate = useNavigate()
    const [editOpen, setEditOpen] = useState(false)

    const handleUpdate = async (formData: {
        name?: string
        structureId?: string | null
        pollingIntervalMinutes?: number
        isActive?: boolean
    }) => {
        await updateSensorFn({ data: { sensorId, ...formData } })
        toast.success('Sensor updated')
        navigate({
            to: '/sensors/$sensorId' as any,
            params: { sensorId } as any,
        })
        return { sensorId }
    }

    const handleDelete = async () => {
        await deleteSensorFn({ data: { sensorId } })
        toast.success('Sensor deleted')
        navigate({ to: '/sensors' as any })
    }

    const handleAcknowledge = async (alertId: string) => {
        await acknowledgeAlertFn({ data: { alertId } })
        toast.success('Alert acknowledged')
    }

    const latestReading = readings[0]

    return (
        <div className="container py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate({ to: '/sensors' as any })}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <h1 className="text-2xl font-bold flex-1">{sensor.name}</h1>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditOpen(true)}
                >
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Sensor</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will delete the sensor. Historical data
                                will be retained for 90 days.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <SensorCard
                    sensor={{
                        id: sensor.id,
                        name: sensor.name,
                        sensorType: sensor.sensorType,
                        status: 'online',
                        latestValue: latestReading?.value ?? null,
                        structureName: null,
                    }}
                    latestReading={
                        latestReading
                            ? {
                                  value: latestReading.value,
                                  recordedAt: new Date(
                                      latestReading.recordedAt,
                                  ),
                              }
                            : undefined
                    }
                />

                <SensorChart
                    sensorId={sensorId}
                    sensorType={sensor.sensorType}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Alert History</CardTitle>
                </CardHeader>
                <CardContent>
                    <AlertHistory
                        alerts={alerts}
                        onAcknowledge={handleAcknowledge}
                    />
                </CardContent>
            </Card>

            <SensorFormDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                structures={[]}
                onSubmit={handleUpdate}
                mode="edit"
                defaultValues={{
                    name: sensor.name,
                    sensorType: sensor.sensorType,
                    pollingIntervalMinutes: sensor.pollingIntervalMinutes,
                }}
            />
        </div>
    )
}
