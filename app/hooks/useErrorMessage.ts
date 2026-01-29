import { useTranslation } from 'react-i18next'
import { AppError } from '~/lib/errors'

export function useErrorMessage() {
  const { t } = useTranslation(['errors'])

  return (error: unknown): string => {
    if (AppError.isAppError(error)) {
      return t(`errors:${error.reason}`, {
        defaultValue: t('errors:unknown'),
      })
    }

    if (error instanceof Error) {
      return error.message
    }

    // Fallback for non-Error objects
    return t('errors:unknown')
  }
}
