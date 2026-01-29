import { useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { createSaleFn, deleteSaleFn, updateSaleFn } from './server'
import type { CreateSaleInput, SalesSearchParams } from './types'
import type { Sale } from '~/components/sales/sale-columns'

interface UseSalesPageProps {
  selectedFarmId: string | null
  routePath: string
}

export function useSalesPage({ selectedFarmId, routePath }: UseSalesPageProps) {
  const { t } = useTranslation(['sales'])
  const navigate = useNavigate({ from: routePath as any })
  const router = useRouter()

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateSearch = (updates: Partial<SalesSearchParams>) => {
    navigate({
      // @ts-expect-error - TanStack Router type inference limitation
      search: (prev: SalesSearchParams) => ({ ...prev, ...updates }),
    })
  }

  const handleCreateSubmit = async (data: Omit<CreateSaleInput, 'farmId'>) => {
    if (!selectedFarmId) return
    setIsSubmitting(true)
    try {
      await createSaleFn({
        data: {
          sale: {
            farmId: selectedFarmId,
            ...data,
          },
        },
      })
      toast.success(t('messages.recorded'))
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (data: Partial<CreateSaleInput>) => {
    if (!selectedSale) return
    setIsSubmitting(true)
    try {
      await updateSaleFn({
        data: {
          saleId: selectedSale.id,
          data: {
            quantity: data.quantity,
            unitPrice: data.unitPrice,
          },
        },
      })
      toast.success(t('messages.updated'))
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedSale) return
    setIsSubmitting(true)
    try {
      await deleteSaleFn({ data: { saleId: selectedSale.id } })
      toast.success(t('messages.deleted'))
      await router.invalidate()
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    selectedSale,
    setSelectedSale,
    isSubmitting,
    updateSearch,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  }
}
