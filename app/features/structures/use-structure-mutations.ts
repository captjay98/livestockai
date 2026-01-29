import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import {
  createStructureFn,
  deleteStructureFn,
  updateStructureFn,
} from './server'
import type {
  CreateStructureInput,
  StructureStatus,
  StructureType,
  UpdateStructureInput,
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
 * Structure record type for cache operations.
 */
export interface StructureCacheRecord extends OptimisticRecord {
  id: string
  farmId: string
  name: string
  type: StructureType
  capacity?: number | null
  areaSqm?: string | null
  status: StructureStatus
  notes?: string | null
  createdAt?: Date
  batchCount?: number
  animalCount?: number
}

/**
 * Query key constants for structure-related queries
 */
export const STRUCTURE_QUERY_KEYS = {
  all: ['structures'] as const,
  lists: () => [...STRUCTURE_QUERY_KEYS.all, 'list'] as const,
  list: (farmId?: string) => [...STRUCTURE_QUERY_KEYS.lists(), farmId] as const,
  details: () => [...STRUCTURE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...STRUCTURE_QUERY_KEYS.details(), id] as const,
  withCounts: (farmId?: string) => ['structures-with-counts', farmId] as const,
} as const

/**
 * Input type for creating a structure mutation
 */
export interface CreateStructureMutationInput {
  structure: CreateStructureInput
}

/**
 * Input type for updating a structure mutation
 */
export interface UpdateStructureMutationInput {
  structureId: string
  data: UpdateStructureInput
}

/**
 * Input type for deleting a structure mutation
 */
export interface DeleteStructureMutationInput {
  structureId: string
}

/**
 * Result type for the useStructureMutations hook
 */
export interface UseStructureMutationsResult {
  createStructure: ReturnType<
    typeof useMutation<
      string,
      Error,
      CreateStructureMutationInput,
      OptimisticContext<Array<StructureCacheRecord>>
    >
  >
  updateStructure: ReturnType<
    typeof useMutation<
      boolean,
      Error,
      UpdateStructureMutationInput,
      OptimisticContext<Array<StructureCacheRecord>>
    >
  >
  deleteStructure: ReturnType<
    typeof useMutation<
      boolean,
      Error,
      DeleteStructureMutationInput,
      OptimisticContext<Array<StructureCacheRecord>>
    >
  >
  isPending: boolean
}

/**
 * Hook for structure mutations with optimistic updates.
 *
 * @returns Object containing mutation functions and pending state
 *
 * **Validates: Requirements 7.3**
 */
export function useStructureMutations(): UseStructureMutationsResult {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['structures', 'common'])

  const rollbackStructures = createRollback<Array<StructureCacheRecord>>(
    queryClient,
    STRUCTURE_QUERY_KEYS.all,
  )

  const createStructure = useMutation<
    string,
    Error,
    CreateStructureMutationInput,
    OptimisticContext<Array<StructureCacheRecord>>
  >({
    mutationFn: async ({ structure }) => {
      return createStructureFn({ data: { input: structure } })
    },

    onMutate: async ({ structure }) => {
      await cancelQueries(queryClient, STRUCTURE_QUERY_KEYS.all)

      const previousStructures = getQueryData<Array<StructureCacheRecord>>(
        queryClient,
        STRUCTURE_QUERY_KEYS.all,
      )
      const tempId = generateEntityTempId('structure')

      const optimisticStructure: Omit<StructureCacheRecord, 'id'> = {
        farmId: structure.farmId,
        name: structure.name,
        type: structure.type,
        capacity: structure.capacity || null,
        areaSqm: structure.areaSqm?.toString() || null,
        status: structure.status,
        notes: structure.notes || null,
        createdAt: new Date(),
        batchCount: 0,
        animalCount: 0,
      }

      const updatedStructures = addOptimisticRecord(
        previousStructures,
        optimisticStructure,
        tempId,
      )
      setQueryData(queryClient, STRUCTURE_QUERY_KEYS.all, updatedStructures)

      return createOptimisticContext(previousStructures, tempId)
    },

    onError: (error, _variables, context) => {
      rollbackStructures(context)
      toast.error(
        t('messages.createError', {
          defaultValue: 'Failed to create structure',
          ns: 'structures',
        }),
        { description: error.message },
      )
    },

    onSuccess: async (serverId, { structure }, context) => {
      if (context.tempId) {
        // Register the temp ID → server ID mapping for dependent mutations
        await tempIdResolver.register(context.tempId, serverId, 'structure')

        // Update pending mutations that reference this temp ID
        tempIdResolver.updatePendingMutations(queryClient)

        const currentStructures = getQueryData<Array<StructureCacheRecord>>(
          queryClient,
          STRUCTURE_QUERY_KEYS.all,
        )

        const serverStructure: StructureCacheRecord = {
          id: serverId,
          farmId: structure.farmId,
          name: structure.name,
          type: structure.type,
          capacity: structure.capacity || null,
          areaSqm: structure.areaSqm?.toString() || null,
          status: structure.status,
          notes: structure.notes || null,
          createdAt: new Date(),
          batchCount: 0,
          animalCount: 0,
          _isOptimistic: false,
          _tempId: undefined,
        }

        const updatedStructures = replaceTempIdWithRecord(
          currentStructures,
          context.tempId,
          serverStructure,
        )
        setQueryData(queryClient, STRUCTURE_QUERY_KEYS.all, updatedStructures)
      }

      toast.success(
        t('messages.created', {
          defaultValue: 'Structure created successfully',
          ns: 'structures',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: STRUCTURE_QUERY_KEYS.all,
      })
      queryClient.invalidateQueries({
        queryKey: ['structures-with-counts'],
      })
    },
  })

  const updateStructure = useMutation<
    boolean,
    Error,
    UpdateStructureMutationInput,
    OptimisticContext<Array<StructureCacheRecord>>
  >({
    mutationFn: async ({ structureId, data }) => {
      return updateStructureFn({ data: { id: structureId, input: data } })
    },

    onMutate: async ({ structureId, data }) => {
      await cancelQueries(queryClient, STRUCTURE_QUERY_KEYS.all)

      const previousStructures = getQueryData<Array<StructureCacheRecord>>(
        queryClient,
        STRUCTURE_QUERY_KEYS.all,
      )

      const updateData: Partial<StructureCacheRecord> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.type !== undefined) updateData.type = data.type
      if (data.capacity !== undefined) updateData.capacity = data.capacity
      if (data.areaSqm !== undefined)
        updateData.areaSqm = data.areaSqm?.toString() || null
      if (data.status !== undefined) updateData.status = data.status
      if (data.notes !== undefined) updateData.notes = data.notes

      const updatedStructures = updateById(
        previousStructures,
        structureId,
        updateData,
      )
      setQueryData(queryClient, STRUCTURE_QUERY_KEYS.all, updatedStructures)

      return createOptimisticContext(previousStructures)
    },

    onError: (error, _variables, context) => {
      rollbackStructures(context)
      toast.error(
        t('messages.updateError', {
          defaultValue: 'Failed to update structure',
          ns: 'structures',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.updated', {
          defaultValue: 'Structure updated successfully',
          ns: 'structures',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: STRUCTURE_QUERY_KEYS.all,
      })
      queryClient.invalidateQueries({
        queryKey: ['structures-with-counts'],
      })
    },
  })

  const deleteStructure = useMutation<
    boolean,
    Error,
    DeleteStructureMutationInput,
    OptimisticContext<Array<StructureCacheRecord>>
  >({
    mutationFn: async ({ structureId }) => {
      return deleteStructureFn({ data: { id: structureId } })
    },

    onMutate: async ({ structureId }) => {
      await cancelQueries(queryClient, STRUCTURE_QUERY_KEYS.all)

      const previousStructures = getQueryData<Array<StructureCacheRecord>>(
        queryClient,
        STRUCTURE_QUERY_KEYS.all,
      )
      const updatedStructures = removeById(previousStructures, structureId)
      setQueryData(queryClient, STRUCTURE_QUERY_KEYS.all, updatedStructures)

      return createOptimisticContext(previousStructures)
    },

    onError: (error, _variables, context) => {
      rollbackStructures(context)
      toast.error(
        t('messages.deleteError', {
          defaultValue: 'Failed to delete structure',
          ns: 'structures',
        }),
        { description: error.message },
      )
    },

    onSuccess: () => {
      toast.success(
        t('messages.deleted', {
          defaultValue: 'Structure deleted successfully',
          ns: 'structures',
        }),
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: STRUCTURE_QUERY_KEYS.all,
      })
      queryClient.invalidateQueries({
        queryKey: ['structures-with-counts'],
      })
    },
  })

  return {
    createStructure,
    updateStructure,
    deleteStructure,
    isPending:
      createStructure.isPending ||
      updateStructure.isPending ||
      deleteStructure.isPending,
  }
}
