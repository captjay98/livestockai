import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, Server } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import type { SensorType } from '~/lib/db/types'
import { PageHeader } from '~/components/page-header'
import { SensorFormDialog } from '~/components/sensors/sensor-form-dialog'
import { SensorList } from '~/components/sensors/sensor-list'
import { SensorsSkeleton } from '~/components/sensors/sensors-skeleton'
import { Button } from '~/components/ui/button'
import { useFarm } from '~/features/farms/context'
import { useSensorMutations } from '~/features/sensors/mutations'
import { getSensorsFn } from '~/features/sensors/server'
import { ErrorPage } from '~/components/error-page'

const sensorsSearchSchema = z.object({
  farmId: z.string().optional(),
})

export const Route = createFileRoute('/_auth/sensors/')({
  validateSearch: sensorsSearchSchema,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
  }),
  loader: async ({ deps }) => {
    if (!deps.farmId) return { sensors: [], structures: [] }

    const farmId = deps.farmId // Type narrowing

    const [sensors, structures] = await Promise.all([
      getSensorsFn({ data: { farmId } }),
      (async () => {
        const { getStructuresFn } = await import('~/features/structures/server')
        return getStructuresFn({ data: { farmId } })
      })(),
    ])

    return { sensors, structures }
  },
  pendingComponent: SensorsSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: SensorsPage,
})

function SensorsPage() {
  const { t } = useTranslation(['sensors', 'common'])
  const { selectedFarmId } = useFarm()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const { sensors, structures } = Route.useLoaderData()

  const { createSensor, deleteSensor } = useSensorMutations()

  const handleCreate = async (data: {
    name: string
    sensorType: SensorType
    structureId?: string
    pollingIntervalMinutes: number
  }): Promise<{ sensorId: string; apiKey?: string }> => {
    if (!selectedFarmId) {
      toast.error(
        t('common:selectFarmFirst', {
          defaultValue: 'Please select a farm first',
        }),
      )
      return { sensorId: '' }
    }

    return new Promise((resolve, reject) => {
      createSensor.mutate(
        { ...data, farmId: selectedFarmId },
        {
          onSuccess: (result) => {
            resolve(result)
          },
          onError: (err) => {
            reject(err)
          },
        },
      )
    })
  }

  const handleDelete = (id: string) => {
    deleteSensor.mutate(id)
  }

  const handleView = (id: string) => {
    navigate({
      to: '/sensors/$sensorId',
      params: { sensorId: id },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('sensors:title', { defaultValue: 'IoT Sensors' })}
        description={t('sensors:description', {
          defaultValue:
            'Monitor your farm environment with real-time sensor data and alerts.',
        })}
        icon={Server}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />{' '}
            {t('sensors:addSensor', { defaultValue: 'Add Sensor' })}
          </Button>
        }
      />

      <div className="bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden border relative p-4 sm:p-6">
        {/* Decorative Orb */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <SensorList
          sensors={sensors}
          structures={structures}
          onDelete={handleDelete}
          onView={handleView}
        />
      </div>

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
