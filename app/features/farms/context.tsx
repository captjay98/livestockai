import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { usePreferences } from '~/features/settings'
import { getStructuresFn } from '~/features/structures/server'
import { getSuppliersFn } from '~/features/suppliers/server'

interface Structure {
  id: string
  name: string
  type: string
  status: string
}

interface Supplier {
  id: string
  name: string
  supplierType: string | null
}

interface FarmContextType {
  selectedFarmId: string | null
  setSelectedFarmId: (farmId: string | null) => void
  structures: Array<Structure>
  suppliers: Array<Supplier>
  isLoadingFarmData: boolean
}

const FarmContext = createContext<FarmContextType | undefined>(undefined)

const STORAGE_KEY = 'openlivestock-selected-farm'

export function FarmProvider({ children }: { children: ReactNode }) {
  const [selectedFarmId, setSelectedFarmIdState] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const { defaultFarmId } = usePreferences()

  // Load structures for selected farm
  const { data: structures = [], isLoading: isLoadingStructures } = useQuery({
    queryKey: ['structures', selectedFarmId],
    queryFn: () =>
      selectedFarmId
        ? getStructuresFn({ data: { farmId: selectedFarmId } })
        : Promise.resolve([]),
    enabled: !!selectedFarmId,
  })

  // Load suppliers (global, not farm-specific currently)
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliersFn({ data: { farmId: undefined } }),
    enabled: !!selectedFarmId,
  })

  // Load from localStorage on mount, or use defaultFarmId from settings
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setSelectedFarmIdState(stored)
    } else if (defaultFarmId) {
      // Auto-select default farm if no farm is currently selected
      setSelectedFarmIdState(defaultFarmId)
    }
    setIsHydrated(true)
  }, [defaultFarmId])

  const setSelectedFarmId = (farmId: string | null) => {
    setSelectedFarmIdState(farmId)
    if (farmId) {
      localStorage.setItem(STORAGE_KEY, farmId)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Don't render children until hydrated to avoid mismatch
  if (!isHydrated) {
    return null
  }

  return (
    <FarmContext.Provider
      value={{
        selectedFarmId,
        setSelectedFarmId,
        structures: structures as Array<Structure>,
        suppliers: suppliers as Array<Supplier>,
        isLoadingFarmData: isLoadingStructures || isLoadingSuppliers,
      }}
    >
      {children}
    </FarmContext.Provider>
  )
}

export function useFarm() {
  const context = useContext(FarmContext)
  if (context === undefined) {
    throw new Error('useFarm must be used within a FarmProvider')
  }
  return context
}

// Re-export for convenience
export { useFarm as useSelectedFarm }
