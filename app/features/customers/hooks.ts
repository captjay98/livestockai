import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  createCustomerFn,
  getCustomersPaginatedFn,
  getTopCustomersFn,
  updateCustomerFn,
} from './server'
import type {
  CustomerRecord,
  CustomerSearchParams,
  PaginatedResult,
} from './types'
import type { TopCustomer } from '~/components/customers/top-customers-card'
import type { CustomerFormData } from '~/components/customers/customer-form-dialog'
import { useFarm } from '~/features/farms/context'

export function useCustomerActions(
  setPaginatedCustomers: (data: PaginatedResult<CustomerRecord>) => void,
  setTopCustomers: (data: Array<TopCustomer>) => void,
  setIsLoading: (loading: boolean) => void,
) {
  const { t } = useTranslation(['customers'])
  const { selectedFarmId } = useFarm()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async (searchParams: CustomerSearchParams) => {
    setIsLoading(true)
    try {
      const [paginatedResult, topCustomersResult] = await Promise.all([
        getCustomersPaginatedFn({
          data: {
            page: searchParams.page,
            pageSize: searchParams.pageSize,
            sortBy: searchParams.sortBy,
            sortOrder: searchParams.sortOrder,
            search: searchParams.q,
            customerType: searchParams.customerType,
          },
        }),
        getTopCustomersFn({ data: { limit: 5 } }),
      ])
      setPaginatedCustomers(paginatedResult)
      setTopCustomers(topCustomersResult as Array<TopCustomer>)
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

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
      loadData({} as CustomerSearchParams) // Will be called with proper params from effect
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
    loadData,
  }
}
