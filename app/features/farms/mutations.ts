import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  assignUserToFarmFn,
  createFarmFn,
  removeUserFromFarmFn,
  updateFarmFn,
  updateUserFarmRoleFn,
} from './server'

export const FARM_QUERY_KEYS = {
  all: ['farms'] as const,
  users: (farmId?: string) =>
    [...FARM_QUERY_KEYS.all, 'users', farmId] as const,
} as const

export function useFarmMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['farms', 'common'])

  const createFarm = useMutation({
    mutationFn: createFarmFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARM_QUERY_KEYS.all })
      toast.success(
        t('farms:messages.created', { defaultValue: 'Farm created' }),
      )
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('common:error.create'))
    },
  })

  const updateFarm = useMutation({
    mutationFn: updateFarmFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARM_QUERY_KEYS.all })
      toast.success(
        t('farms:messages.updated', { defaultValue: 'Farm updated' }),
      )
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('common:error.update'))
    },
  })

  return {
    createFarm,
    updateFarm,
    isPending: createFarm.isPending || updateFarm.isPending,
  }
}

export function useFarmUserMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['settings', 'common'])

  const assignUserToFarm = useMutation({
    mutationFn: (data: {
      userId: string
      farmId: string
      role: 'owner' | 'manager' | 'viewer'
    }) => assignUserToFarmFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARM_QUERY_KEYS.all })
      toast.success(
        t('settings:users.messages.farmAssigned', {
          defaultValue: 'User assigned to farm',
        }),
      )
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : t('settings:users.errors.assignFarm', {
              defaultValue: 'Failed to assign user to farm',
            }),
      )
    },
  })

  const updateUserFarmRole = useMutation({
    mutationFn: (data: {
      userId: string
      farmId: string
      role: 'owner' | 'manager' | 'viewer'
    }) => updateUserFarmRoleFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARM_QUERY_KEYS.all })
      toast.success(
        t('settings:users.messages.roleUpdated', {
          defaultValue: 'User role updated',
        }),
      )
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : t('settings:users.errors.updateFarmRole', {
              defaultValue: 'Failed to update user role',
            }),
      )
    },
  })

  const removeUserFromFarm = useMutation({
    mutationFn: (data: { userId: string; farmId: string }) =>
      removeUserFromFarmFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARM_QUERY_KEYS.all })
      toast.success(
        t('settings:users.messages.farmRemoved', {
          defaultValue: 'User removed from farm',
        }),
      )
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : t('settings:users.errors.removeFromFarm', {
              defaultValue: 'Failed to remove user from farm',
            }),
      )
    },
  })

  return {
    assignUserToFarm,
    updateUserFarmRole,
    removeUserFromFarm,
    isPending:
      assignUserToFarm.isPending ||
      updateUserFarmRole.isPending ||
      removeUserFromFarm.isPending,
  }
}
