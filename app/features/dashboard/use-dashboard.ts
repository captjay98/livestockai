import { useEffect, useState } from 'react'
import { getDashboardDataFn } from './server'
import type { DashboardAction, DashboardFarm } from './types'

/**
 * Custom hook for dashboard state management
 */
export function useDashboard(selectedFarmId: string | null) {
  const [stats, setStats] = useState<any>(null)
  const [hasFarms, setHasFarms] = useState<boolean | null>(null)
  const [farms, setFarms] = useState<Array<DashboardFarm>>([])
  const [isLoading, setIsLoading] = useState(true)

  // Dialog states
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editFarmDialogOpen, setEditFarmDialogOpen] = useState(false)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [saleDialogOpen, setSaleDialogOpen] = useState(false)
  const [feedDialogOpen, setFeedDialogOpen] = useState(false)
  const [eggDialogOpen, setEggDialogOpen] = useState(false)
  const [mortalityDialogOpen, setMortalityDialogOpen] = useState(false)
  const [selectedFarmForEdit, setSelectedFarmForEdit] =
    useState<DashboardFarm | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const result = await getDashboardDataFn({
          data: { farmId: selectedFarmId },
        })
        setStats(result.stats)
        setHasFarms(result.hasFarms)
        setFarms(result.farms)
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [selectedFarmId])

  const openEditFarmDialog = (farm: DashboardFarm) => {
    setSelectedFarmForEdit(farm)
    setEditFarmDialogOpen(true)
  }

  const handleAction = (action: DashboardAction) => {
    if (!selectedFarmId) return
    switch (action) {
      case 'batch':
        setBatchDialogOpen(true)
        break
      case 'feed':
        setFeedDialogOpen(true)
        break
      case 'expense':
        setExpenseDialogOpen(true)
        break
      case 'sale':
        setSaleDialogOpen(true)
        break
      case 'mortality':
        setMortalityDialogOpen(true)
        break
    }
  }

  return {
    // Data
    stats,
    hasFarms,
    farms,
    isLoading,
    selectedFarmForEdit,

    // Actions
    openEditFarmDialog,
    handleAction,

    // Dialog states
    expenseDialogOpen,
    setExpenseDialogOpen,
    editFarmDialogOpen,
    setEditFarmDialogOpen,
    batchDialogOpen,
    setBatchDialogOpen,
    saleDialogOpen,
    setSaleDialogOpen,
    feedDialogOpen,
    setFeedDialogOpen,
    eggDialogOpen,
    setEggDialogOpen,
    mortalityDialogOpen,
    setMortalityDialogOpen,
  }
}
