import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useRouter } from '@tanstack/react-router'
import { createCustomerFn, updateCustomerFn } from './server'
import type { CustomerRecord } from './types'
import type { CustomerFormData } from '~/components/customers/customer-form-dialog'
import { useFarm } from '~/features/farms/context'

export function useCustomerActions() {
  const { t } = useTranslation(['customers'])
  const { selectedFarmId } = useFarm()
  const router = useRouter()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateOpen = () => {
    setDialogMode('create')
    setSelectedCustomer(null)
    setDialogOpen(true)
  }

  const handleEditOpen = (customer: CustomerRecord) => {
    setDialogMode('edit')
    setSelectedCustomer(customer)
    setDialogOpen(true)
  }

  const handleFormSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true)
    try {
      if (dialogMode === 'create') {
        await createCustomerFn({
          data: {
            farmId: selectedFarmId ?? '',
            ...data,
            email: data.email || null,
            location: data.location || null,
            customerType: data.customerType || null,
          },
        })
        toast.success(
          t('form.createSuccess', { defaultValue: 'Customer added' }),
        )
      } else {
        if (!selectedCustomer) return
        await updateCustomerFn({
          data: {
            id: selectedCustomer.id,
            data: {
              name: data.name,
              phone: data.phone,
              email: data.email || null,
              location: data.location || null,
              customerType: data.customerType || null,
            },
          },
        })
        toast.success(
          t('messages.updated', { defaultValue: 'Customer updated' }),
        )
      }
      setDialogOpen(false)
      // Invalidate router to trigger loader refetch
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    dialogOpen,
    setDialogOpen,
    dialogMode,
    selectedCustomer,
    isSubmitting,
    handleCreateOpen,
    handleEditOpen,
    handleFormSubmit,
  }
}
