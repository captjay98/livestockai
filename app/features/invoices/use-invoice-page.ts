import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { getInvoicesPaginatedFn } from './server'
import type {
  InvoiceRecord,
  InvoiceSearchParams,
  PaginatedResult,
} from './types'

interface UseInvoicePageProps {
  searchParams: InvoiceSearchParams
  routePath: string
}

export function useInvoicePage({
  searchParams,
  routePath,
}: UseInvoicePageProps) {
  const navigate = useNavigate({ from: routePath as any })

  const [paginatedInvoices, setPaginatedInvoices] = useState<
    PaginatedResult<InvoiceRecord>
  >({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })

  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await getInvoicesPaginatedFn({
        data: {
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          status:
            searchParams.status === 'all' ? undefined : searchParams.status,
        },
      })
      setPaginatedInvoices(result as PaginatedResult<InvoiceRecord>)
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [
    searchParams.page,
    searchParams.pageSize,
    searchParams.sortBy,
    searchParams.sortOrder,
    searchParams.q,
    searchParams.status,
  ])

  const updateSearch = (updates: Partial<InvoiceSearchParams>) => {
    navigate({
      // @ts-ignore - Type limitation
      search: (prev: any) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  return {
    paginatedInvoices,
    isLoading,
    updateSearch,
  }
}
