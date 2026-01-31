import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { markOnboardingCompleteFn, resetOnboardingFn } from './server'

export const ONBOARDING_QUERY_KEYS = {
  all: ['onboarding'] as const,
  status: () => [...ONBOARDING_QUERY_KEYS.all, 'status'] as const,
} as const

export function useOnboardingMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['onboarding', 'settings', 'common'])

  const markComplete = useMutation({
    mutationFn: () => markOnboardingCompleteFn({ data: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEYS.all })
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : t('common:error.generic', {
              defaultValue: 'Something went wrong',
            }),
      )
    },
  })

  const resetOnboarding = useMutation({
    mutationFn: () => resetOnboardingFn({ data: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEYS.all })
      localStorage.removeItem('livestockai_onboarding')
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : t('settings:help.resetOnboardingFailed', {
              defaultValue: 'Failed to reset onboarding',
            }),
      )
    },
  })

  return {
    markComplete,
    resetOnboarding,
    isPending: markComplete.isPending || resetOnboarding.isPending,
  }
}
