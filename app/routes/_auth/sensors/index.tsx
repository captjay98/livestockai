import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import type { SensorType } from '~/lib/db/types'
import { Button } from '~/components/ui/button'
import { SensorList } from '~/components/sensors/sensor-list'
import { SensorFormDialog } from '~/components/sensors/sensor-form-dialog'
import {
    createSensorFn,
    deleteSensorFn,
    getSensorsFn,
} from '~/features/sensors/server'

export const Route = createFileRoute('/_auth/sensors/' as any)({
    loader: async () => {
        const { getStructuresFn } = await import('~/features/structures/server')
        const { getUserSettings } = await import('~/features/settings/server')

        const settings = await getUserSettings({ data: {} })
        const farmId = settings.defaultFarmId

        const [sensors, structures] = await Promise.all([
            getSensorsFn({ data: {} }),
            farmId
                ? getStructuresFn({ data: { farmId } })
                : Promise.resolve([]),
        ])
        return { sensors, structures, farmId }
    },
    component: SensorsPage,
})

function SensorsPage() {
    const { sensors, structures, farmId } = Route.useLoaderData()
    const navigate = useNavigate()
    const [dialogOpen, setDialogOpen] = useState(false)

    const handleCreate = async (data: {
        name: string
        sensorType: SensorType
        structureId?: string
        pollingIntervalMinutes: number
    }): Promise<{ sensorId: string; apiKey?: string }> => {
        if (!farmId) {
            toast.error('Please set a default farm in settings')
            return { sensorId: '' }
        }
        const result = await createSensorFn({ data: { ...data, farmId } })
        toast.success(`Sensor created! API Key: ${result.apiKey}`)
        navigate({ to: '/sensors' as any })
        return result
    }

    const handleDelete = async (id: string) => {
        await deleteSensorFn({ data: { sensorId: id } })
        toast.success('Sensor deleted')
        navigate({ to: '/sensors' as any })
    }

    const handleView = (id: string) => {
        navigate({
            to: '/sensors/$sensorId' as any,
            params: { sensorId: id } as any,
        })
    }

    return (
        <div className="container py-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Sensors</h1>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Sensor
                </Button>
            </div>

            <SensorList
                sensors={sensors}
                structures={structures}
                onDelete={handleDelete}
                onView={handleView}
            />

            <SensorFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                structures={structures}
                onSubmit={handleCreate}
                mode="create"
            />
        </div>
    )
}
