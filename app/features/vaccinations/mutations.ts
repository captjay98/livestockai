import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import {
  createTreatmentFn,
  createVaccinationFn,
  deleteTreatmentFn,
  deleteVaccinationFn,
  updateTreatmentFn,
  updateVaccinationFn,
} from './server'
import type {
  CreateTreatmentInput,
  CreateVaccinationInput,
  UpdateTreatmentInput,
  UpdateVaccinationInput,
} from './server'
import type {
  OptimisticContext,
  OptimisticRecord,
} from '~/lib/optimistic-utils'
import {
  addOptimisticRecord,
  cancelQueries,
  createOptimisticContext,
  createRollback,
  generateEntityTempId,
  getQueryData,
  removeById,
  replaceTempIdWithRecord,
  setQueryData,
  updateById,
} from '~/lib/optimistic-utils'
import { tempIdResolver } from '~/lib/temp-id-resolver'

/**
 * Health record type for cache operations (vaccinations and treatments).
 */
export interface HealthRecord extends OptimisticRecord {
  id: string
  batchId: string
  batchSpecies?: string | null
  type: 'vaccination' | 'treatment'
  name: string
  date: Date
  dosage: string
  nextDueDate?: Date | null
  withdrawalDays?: number | null
  notes?: string | null
}

/**
 * Query key constants for health-related queries
 */
export const HEALTH_QUERY_KEYS = {
  all: ['health-records'] as const,
  lists: () => [...HEALTH_QUERY_KEYS.all, 'list'] as const,
  list: (farmId?: string) => [...HEALTH_QUERY_KEYS.lists(), farmId] as const,
  vaccinations: () => [...HEALTH_QUERY_KEYS.all, 'vaccinations'] as const,
  treatments: () => [...HEALTH_QUERY_KEYS.all, 'treatments'] as const,
  alerts: (farmId?: string) => ['vaccination-alerts', farmId] as const,
} as const

/**
 * Input types for vaccination mutations
 */
export interface CreateVaccinationMutationInput {
  farmId: string
  data: CreateVaccinationInput
}

export interface UpdateVaccinationMutationInput {
  recordId: string
  data: UpdateVaccinationInput
}

export interface DeleteVaccinationMutationInput {
  recordId: string
}

/**
 * Input types for treatment mutations
 */
export interface CreateTreatmentMutationInput {
  farmId: string
  data: CreateTreatmentInput
}

export interface UpdateTreatmentMutationInput {
  recordId: string
  data: UpdateTreatmentInput
}

export interface DeleteTreatmentMutationInput {
  recordId: string
}

/**
 * Result type for the useVaccinationMutations hook
 */
export interface UseVaccinationMutationsResult {
  createVaccination: ReturnType<
    typeof useMutation<
      string,
      Error,
      CreateVaccinationMutationInput,
      OptimisticContext<Array<HealthRecord>>
    >
  >
  updateVaccination: ReturnType<
    typeof useMutation<
      void,
      Error,
      UpdateVaccinationMutationInput,
      OptimisticContext<Array<HealthRecord>>
    >
  >
  deleteVaccination: ReturnType<
    typeof useMutation<
      void,
      Error,
      DeleteVaccinationMutationInput,
      OptimisticContext<Array<HealthRecord>>
    >
  >
  createTreatment: ReturnType<
    typeof useMutation<
      string,
      Error,
      CreateTreatmentMutationInput,
      OptimisticContext<Array<HealthRecord>>
    >
  >
  updateTreatment: ReturnType<
    typeof useMutation<
      void,
      Error,
      UpdateTreatmentMutationInput,
      OptimisticContext<Array<HealthRecord>>
    >
  >
  deleteTreatment: ReturnType<
    typeof useMutation<
      void,
      Error,
      DeleteTreatmentMutationInput,
      OptimisticContext<Array<HealthRecord>>
    >
  >
  isPending: boolean
}

/**
 * Hook for vaccination and treatment mutations with optimistic updates.
 *
 * @returns Object containing mutation functions and pending state
 *
 * **Validates: Requirements 5.6**
 */
export function useVaccinationMutations(): UseVaccinationMutationsResult {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['vaccinations', 'common'])

  const rollbackHealth = createRollback<Array<HealthRecord>>(
    queryClient,
    HEALTH_QUERY_KEYS.all,
  )

  // Vaccination mutations
  const createVaccination = useMutation<
    string,
    Error,
    CreateVaccinationMutationInput,
    OptimisticContext<Array<HealthRecord>>
  >({
    mutationFn: async ({ farmId, data }) => {
      return createVaccinationFn({ data: { farmId, data } })
    },

    onMutate: async ({ data }) => {
      await cancelQueries(queryClient, HEALTH_QUERY_KEYS.all)

      const previousRecords = getQueryData<Array<HealthRecord>>(
        queryClient,
        HEALTH_QUERY_KEYS.all,
      )
      const tempId = generateEntityTempId('vaccination')

      const optimisticRecord: Omit<HealthRecord, 'id'> = {
        batchId: data.batchId,
        type: 'vaccination',
        name: data.vaccineName,
        date: data.dateAdministered,
        dosage: data.dosage,
        nextDueDate: data.nextDueDate || null,
        notes: data.notes || null,
      }

      const updatedRecords = addOptimisticRecord(
        previousRecords,
        optimisticRecord,
        tempId,
      )
      setQueryData(queryClient, HEALTH_QUERY_KEYS.all, updatedRecords)

      return createOptimisticContext(previousRecords, tempId)
    },

    onError: (error, _variables, context) => {
      rollbackHealth(context)
      toast.error(
        t('messages.createError', {
          defaultValue: 'Failed to create vaccination record',
          ns: 'vaccinations',
        }),
        { description: error.message },
      )
    },

    onSuccess: async (serverId, { data }, context) => {
      if (context.tempId) {
        // Register the temp ID → server ID mapping for dependent mutations
        await tempIdResolver.register(context.tempId, serverId, 'vaccination')

        // Update pending mutations that reference this temp ID
        tempIdResolver.updatePendingMutations(queryClient)

        const currentRecords = getQueryData<Array<HealthRecord>>(
          queryClient,
          HEALTH_QUERY_KEYS.all,
        )

        const serverRecord: HealthRecord = {
          id: serverId,
          batchId: data.batchId,
          type: 'vaccination',
          name: data.vaccineName,
          date: data.dateAdministered,
          dosage: data.dosage,
          nextDueDate: data.nextDueDate || null,
          notes: data.notes || null,
          _isOptimistic: false,
          _tempId: undefined,
        }

        const updatedRecords = replaceTempIdWithRecord(
          currentRecords,
          context.tempId,
          serverRecord,
        )
        setQueryData(queryClient, HEALTH_QUERY_KEYS.all, updatedRecords)
      }

      toast.success(
        t('messages.created', {
          defaultValue: 'Vaccination record created successfully',
          ns: 'vaccinations',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.alerts() })
    },
  })

  const updateVaccination = useMutation<
    void,
    Error,
    UpdateVaccinationMutationInput,
    OptimisticContext<Array<HealthRecord>>
  >({
    mutationFn: async ({ recordId, data }) => {
      return updateVaccinationFn({ data: { recordId, data } })
    },

    onMutate: async ({ recordId, data }) => {
      await cancelQueries(queryClient, HEALTH_QUERY_KEYS.all)

      const previousRecords = getQueryData<Array<HealthRecord>>(
        queryClient,
        HEALTH_QUERY_KEYS.all,
      )

      const updateData: Partial<HealthRecord> = {}
      if (data.vaccineName) updateData.name = data.vaccineName
      if (data.dateAdministered) updateData.date = data.dateAdministered
      if (data.dosage) updateData.dosage = data.dosage
      if (data.nextDueDate !== undefined)
        updateData.nextDueDate = data.nextDueDate
      if (data.notes !== undefined) updateData.notes = data.notes

      const updatedRecords = updateById(previousRecords, recordId, updateData)
      setQueryData(queryClient, HEALTH_QUERY_KEYS.all, updatedRecords)

      return createOptimisticContext(previousRecords)
    },

    onError: (error, _variables, context) => {
      rollbackHealth(context)
      toast.error(
        t('messages.updateError', {
          defaultValue: 'Failed to update vaccination record',
          ns: 'vaccinations',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.updated', {
          defaultValue: 'Vaccination record updated successfully',
          ns: 'vaccinations',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.alerts() })
    },
  })

  const deleteVaccination = useMutation<
    void,
    Error,
    DeleteVaccinationMutationInput,
    OptimisticContext<Array<HealthRecord>>
  >({
    mutationFn: async ({ recordId }) => {
      await deleteVaccinationFn({ data: { recordId } })
    },

    onMutate: async ({ recordId }) => {
      await cancelQueries(queryClient, HEALTH_QUERY_KEYS.all)

      const previousRecords = getQueryData<Array<HealthRecord>>(
        queryClient,
        HEALTH_QUERY_KEYS.all,
      )
      const updatedRecords = removeById(previousRecords, recordId)
      setQueryData(queryClient, HEALTH_QUERY_KEYS.all, updatedRecords)

      return createOptimisticContext(previousRecords)
    },

    onError: (error, _variables, context) => {
      rollbackHealth(context)
      toast.error(
        t('messages.deleteError', {
          defaultValue: 'Failed to delete vaccination record',
          ns: 'vaccinations',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.deleted', {
          defaultValue: 'Vaccination record deleted successfully',
          ns: 'vaccinations',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.alerts() })
    },
  })

  // Treatment mutations
  const createTreatment = useMutation<
    string,
    Error,
    CreateTreatmentMutationInput,
    OptimisticContext<Array<HealthRecord>>
  >({
    mutationFn: async ({ farmId, data }) => {
      return createTreatmentFn({ data: { farmId, data } })
    },

    onMutate: async ({ data }) => {
      await cancelQueries(queryClient, HEALTH_QUERY_KEYS.all)

      const previousRecords = getQueryData<Array<HealthRecord>>(
        queryClient,
        HEALTH_QUERY_KEYS.all,
      )
      const tempId = generateEntityTempId('treatment')

      const optimisticRecord: Omit<HealthRecord, 'id'> = {
        batchId: data.batchId,
        type: 'treatment',
        name: data.medicationName,
        date: data.date,
        dosage: data.dosage,
        withdrawalDays: data.withdrawalDays,
        notes: data.notes || null,
      }

      const updatedRecords = addOptimisticRecord(
        previousRecords,
        optimisticRecord,
        tempId,
      )
      setQueryData(queryClient, HEALTH_QUERY_KEYS.all, updatedRecords)

      return createOptimisticContext(previousRecords, tempId)
    },

    onError: (error, _variables, context) => {
      rollbackHealth(context)
      toast.error(
        t('messages.treatmentCreateError', {
          defaultValue: 'Failed to create treatment record',
          ns: 'vaccinations',
        }),
        { description: error.message },
      )
    },

    onSuccess: async (serverId, { data }, context) => {
      if (context.tempId) {
        // Register the temp ID → server ID mapping for dependent mutations
        // Note: Using 'vaccination' entity type for treatments as they share the same cache
        await tempIdResolver.register(context.tempId, serverId, 'vaccination')

        // Update pending mutations that reference this temp ID
        tempIdResolver.updatePendingMutations(queryClient)

        const currentRecords = getQueryData<Array<HealthRecord>>(
          queryClient,
          HEALTH_QUERY_KEYS.all,
        )

        const serverRecord: HealthRecord = {
          id: serverId,
          batchId: data.batchId,
          type: 'treatment',
          name: data.medicationName,
          date: data.date,
          dosage: data.dosage,
          withdrawalDays: data.withdrawalDays,
          notes: data.notes || null,
          _isOptimistic: false,
          _tempId: undefined,
        }

        const updatedRecords = replaceTempIdWithRecord(
          currentRecords,
          context.tempId,
          serverRecord,
        )
        setQueryData(queryClient, HEALTH_QUERY_KEYS.all, updatedRecords)
      }

      toast.success(
        t('messages.treatmentCreated', {
          defaultValue: 'Treatment record created successfully',
          ns: 'vaccinations',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.all })
    },
  })

  const updateTreatment = useMutation<
    void,
    Error,
    UpdateTreatmentMutationInput,
    OptimisticContext<Array<HealthRecord>>
  >({
    mutationFn: async ({ recordId, data }) => {
      return updateTreatmentFn({ data: { recordId, data } })
    },

    onMutate: async ({ recordId, data }) => {
      await cancelQueries(queryClient, HEALTH_QUERY_KEYS.all)

      const previousRecords = getQueryData<Array<HealthRecord>>(
        queryClient,
        HEALTH_QUERY_KEYS.all,
      )

      const updateData: Partial<HealthRecord> = {}
      if (data.medicationName) updateData.name = data.medicationName
      if (data.date) updateData.date = data.date
      if (data.dosage) updateData.dosage = data.dosage
      if (data.withdrawalDays !== undefined)
        updateData.withdrawalDays = data.withdrawalDays
      if (data.notes !== undefined) updateData.notes = data.notes

      const updatedRecords = updateById(previousRecords, recordId, updateData)
      setQueryData(queryClient, HEALTH_QUERY_KEYS.all, updatedRecords)

      return createOptimisticContext(previousRecords)
    },

    onError: (error, _variables, context) => {
      rollbackHealth(context)
      toast.error(
        t('messages.treatmentUpdateError', {
          defaultValue: 'Failed to update treatment record',
          ns: 'vaccinations',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.treatmentUpdated', {
          defaultValue: 'Treatment record updated successfully',
          ns: 'vaccinations',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.all })
    },
  })

  const deleteTreatment = useMutation<
    void,
    Error,
    DeleteTreatmentMutationInput,
    OptimisticContext<Array<HealthRecord>>
  >({
    mutationFn: async ({ recordId }) => {
      await deleteTreatmentFn({ data: { recordId } })
    },

    onMutate: async ({ recordId }) => {
      await cancelQueries(queryClient, HEALTH_QUERY_KEYS.all)

      const previousRecords = getQueryData<Array<HealthRecord>>(
        queryClient,
        HEALTH_QUERY_KEYS.all,
      )
      const updatedRecords = removeById(previousRecords, recordId)
      setQueryData(queryClient, HEALTH_QUERY_KEYS.all, updatedRecords)

      return createOptimisticContext(previousRecords)
    },

    onError: (error, _variables, context) => {
      rollbackHealth(context)
      toast.error(
        t('messages.treatmentDeleteError', {
          defaultValue: 'Failed to delete treatment record',
          ns: 'vaccinations',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.treatmentDeleted', {
          defaultValue: 'Treatment record deleted successfully',
          ns: 'vaccinations',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.all })
    },
  })

  return {
    createVaccination,
    updateVaccination,
    deleteVaccination,
    createTreatment,
    updateTreatment,
    deleteTreatment,
    isPending:
      createVaccination.isPending ||
      updateVaccination.isPending ||
      deleteVaccination.isPending ||
      createTreatment.isPending ||
      updateTreatment.isPending ||
      deleteTreatment.isPending,
  }
}
