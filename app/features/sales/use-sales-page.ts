import { useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useSalesMutations } from './mutations'
import type { CreateSaleInput, SalesSearchParams } from './types'
import type { Sale } from '~/components/sales/sale-columns'

interface UseSalesPageProps {
  selectedFarmId: string | null
  routePath: string
}

export function useSalesPage({ selectedFarmId, routePath }: UseSalesPageProps) {
  const navigate = useNavigate({ from: routePath as any })
  const router = useRouter()

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const {
    createSale,
    updateSale,
    deleteSale,
    isPending: isSubmitting,
  } = useSalesMutations()

  const updateSearch = (updates: Partial<SalesSearchParams>) => {
    navigate({
      // @ts-expect-error - TanStack Router type inference limitation
      search: (prev: SalesSearchParams) => ({ ...prev, ...updates }),
    })
  }

  const handleCreateSubmit = (data: Omit<CreateSaleInput, 'farmId'>) => {
    if (!selectedFarmId) return
    createSale.mutate(
      {
        sale: {
          farmId: selectedFarmId,
          ...data,
        },
      },
      {
        onSuccess: () => {
          router.invalidate()
        },
      },
    )
  }

  const handleEditSubmit = (data: Partial<CreateSaleInput>) => {
    if (!selectedSale) return
    updateSale.mutate(
      {
        saleId: selectedSale.id,
        data: {
          quantity: data.quantity,
          unitPrice: data.unitPrice,
        },
      },
      {
        onSuccess: () => {
          router.invalidate()
        },
      },
    )
  }

  const handleDeleteConfirm = () => {
    if (!selectedSale) return
    deleteSale.mutate(
      {
        saleId: selectedSale.id,
      },
      {
        onSuccess: () => {
          router.invalidate()
        },
      },
    )
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
