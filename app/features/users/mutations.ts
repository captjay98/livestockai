import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { createUserFn, setUserPasswordFn } from './server'

export const USER_QUERY_KEYS = {
  all: ['users'] as const,
  list: () => [...USER_QUERY_KEYS.all, 'list'] as const,
} as const

export function useUserMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['settings', 'common'])

  const createUser = useMutation({
    mutationFn: (data: {
      email: string
      password: string
      name: string
      role: 'user' | 'admin'
    }) => createUserFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all })
      toast.success(
        t('settings:users.messages.created', {
          defaultValue: 'User created successfully',
        }),
      )
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : t('settings:users.errors.create', {
              defaultValue: 'Failed to create user',
            }),
      )
    },
  })

  const setUserPassword = useMutation({
    mutationFn: (data: { userId: string; newPassword: string }) =>
      setUserPasswordFn({ data }),
    onSuccess: () => {
      toast.success(
        t('settings:users.messages.passwordReset', {
          defaultValue: 'Password reset successfully',
        }),
      )
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : t('settings:users.errors.resetPassword', {
              defaultValue: 'Failed to reset password',
            }),
      )
    },
  })

  return {
    createUser,
    setUserPassword,
    isPending: createUser.isPending || setUserPassword.isPending,
  }
}
