import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { getSuppliersPaginatedFn } from './server'
import type {
  PaginatedResult,
  SupplierRecord,
  SupplierSearchParams,
} from './types'

interface UseSupplierPageProps {
  searchParams: SupplierSearchParams
  routePath: string
}

export function useSupplierPage({
  searchParams,
  routePath,
}: UseSupplierPageProps) {
  const navigate = useNavigate({ from: routePath as any })

  const [paginatedSuppliers, setPaginatedSuppliers] = useState<
    PaginatedResult<SupplierRecord>
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
      const result = await getSuppliersPaginatedFn({
        data: {
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
          supplierType: searchParams.supplierType,
        },
      })
      setPaginatedSuppliers(result)
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
    searchParams.supplierType,
  ])

  const updateSearch = (updates: Partial<SupplierSearchParams>) => {
    navigate({
      // @ts-ignore - Type limitation
      search: (prev: any) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  return {
    paginatedSuppliers,
    isLoading,
    loadData,
    updateSearch,
  }
}
