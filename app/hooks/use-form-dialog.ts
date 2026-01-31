import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useErrorMessage } from './useErrorMessage'

interface UseFormDialogOptions<T> {
  onSubmit: (data: T) => Promise<void>
  onSuccess?: () => void
  onError?: (error: string) => void
  initialData?: T
}

export function useFormDialog<T extends Record<string, any>>(
  options: UseFormDialogOptions<T>,
) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<T>(options.initialData || ({} as T))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const getErrorMessage = useErrorMessage()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { t } = useTranslation(['common'])

  const open = () => setIsOpen(true)
  const close = () => {
    setIsOpen(false)
    setFormData(options.initialData || ({} as T))
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      await options.onSubmit(formData)

      if (options.onSuccess) {
        options.onSuccess()
      } else {
        toast.success(t('common:messages.success', { defaultValue: 'Success' }))
        close()
        router.invalidate()
        queryClient.invalidateQueries()
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      if (options.onError) {
        options.onError(errorMessage)
      } else {
        setErrors({ general: errorMessage })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isOpen,
    open,
    close,
    formData,
    setFormData,
    errors,
    setErrors,
    isSubmitting,
    handleSubmit,
  }
}
