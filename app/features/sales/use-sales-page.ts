import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  createSaleFn,
  deleteSaleFn,
  getSalesPaginatedFn,
  getSalesSummaryFn,
  updateSaleFn,
} from './server'
import type {
  PaginatedResult,
  SaleBatch,
  SaleCustomer,
  SalesSearchParams,
  SalesSummaryData,
} from './types'
import type { Sale } from '~/components/sales/sale-columns'
import { getBatchesFn } from '~/features/batches/server'
import { getCustomersFn } from '~/features/customers/server'

interface UseSalesPageProps {
  selectedFarmId: string | null
  searchParams: SalesSearchParams
  routePath: string
}

export function useSalesPage({
  selectedFarmId,
  searchParams,
  routePath,
}: UseSalesPageProps) {
  const { t } = useTranslation(['sales'])
  const navigate = useNavigate({ from: routePath as any })

  const [paginatedSales, setPaginatedSales] = useState<PaginatedResult<Sale>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [summary, setSummary] = useState<SalesSummaryData | null>(null)
  const [batches, setBatches] = useState<Array<SaleBatch>>([])
  const [customers, setCustomers] = useState<Array<SaleCustomer>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [paginatedResult, summaryResult, batchesResult, customersResult] =
        await Promise.all([
          getSalesPaginatedFn({
            data: {
              farmId: selectedFarmId ?? undefined,
              page: searchParams.page,
              pageSize: searchParams.pageSize,
              sortBy: searchParams.sortBy,
              sortOrder: searchParams.sortOrder,
              search: searchParams.q,
              livestockType: searchParams.livestockType,
              paymentStatus: searchParams.paymentStatus,
            },
          }),
          getSalesSummaryFn({ data: { farmId: selectedFarmId ?? undefined } }),
          selectedFarmId
            ? getBatchesFn({ data: { farmId: selectedFarmId } })
            : Promise.resolve([]),
          getCustomersFn(),
        ])

      setPaginatedSales(paginatedResult as PaginatedResult<Sale>)
      setSummary(summaryResult as SalesSummaryData)
      setBatches(
        batchesResult.filter(
          (b: any) => b.status === 'active',
        ) as Array<SaleBatch>,
      )
      setCustomers(customersResult as Array<SaleCustomer>)
    } catch (err) {
      console.error('Failed to load sales data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [
    selectedFarmId,
    searchParams.page,
    searchParams.pageSize,
    searchParams.sortBy,
    searchParams.sortOrder,
    searchParams.q,
    searchParams.livestockType,
    searchParams.paymentStatus,
  ])

  const updateSearch = (updates: Partial<SalesSearchParams>) => {
    navigate({
    // @ts-expect-error - TanStack Router type inference limitation
      search: (prev: SalesSearchParams) => ({ ...prev, ...updates }),
    })
  }

  const handleCreateSubmit = async (data: any) => {
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
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (data: any) => {
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
      loadData()
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
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    paginatedSales,
    summary,
    batches,
    customers,
    isLoading,
    selectedSale,
    setSelectedSale,
    isSubmitting,
    updateSearch,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteConfirm,
  }
}
