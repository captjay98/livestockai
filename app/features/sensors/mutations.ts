import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  createSensorFn,
  deleteSensorFn,
  getSensorsFn,
  updateSensorFn,
} from './server'
import type { SensorType } from '~/lib/db'

export const SENSOR_QUERY_KEYS = {
  all: ['sensors'] as const,
  byFarm: (farmId: string | null) =>
    [...SENSOR_QUERY_KEYS.all, farmId] as const,
} as const

export function useSensors(farmId: string | null) {
  return useQuery({
    queryKey: SENSOR_QUERY_KEYS.byFarm(farmId),
    queryFn: () => getSensorsFn({ data: { farmId: farmId || undefined } }),
    enabled: !!farmId,
  })
}

export function useSensorMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['common'])

  const createSensor = useMutation({
    mutationFn: async (data: {
      farmId: string
      name: string
      sensorType: SensorType
      structureId?: string
      pollingIntervalMinutes: number
    }) => {
      return createSensorFn({ data })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: SENSOR_QUERY_KEYS.byFarm(variables.farmId),
      })
      toast.success(t('common:created', { defaultValue: 'Sensor created' }))
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('common:error.create'))
    },
  })

  const updateSensor = useMutation({
    mutationFn: async (data: {
      sensorId: string
      name?: string
      structureId?: string | null
      pollingIntervalMinutes?: number
      isActive?: boolean
    }) => {
      return updateSensorFn({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SENSOR_QUERY_KEYS.all })
      toast.success(t('common:updated', { defaultValue: 'Sensor updated' }))
    },
  })

  const deleteSensor = useMutation({
    mutationFn: async (sensorId: string) => {
      return deleteSensorFn({ data: { sensorId } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SENSOR_QUERY_KEYS.all })
      toast.success(t('common:deleted', { defaultValue: 'Sensor deleted' }))
    },
  })

  return {
    createSensor,
    updateSensor,
    deleteSensor,
    isPending:
      createSensor.isPending ||
      updateSensor.isPending ||
      deleteSensor.isPending,
  }
}
