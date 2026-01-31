import { useState } from 'react'
import type { DashboardAction, DashboardFarm } from './types'

/**
 * Custom hook for dashboard dialog state management
 */
export function useDashboard(selectedFarmId: string | null) {
  // Dialog states
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editFarmDialogOpen, setEditFarmDialogOpen] = useState(false)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)

  const [feedDialogOpen, setFeedDialogOpen] = useState(false)
  const [eggDialogOpen, setEggDialogOpen] = useState(false)
  const [mortalityDialogOpen, setMortalityDialogOpen] = useState(false)
  const [selectedFarmForEdit, setSelectedFarmForEdit] =
    useState<DashboardFarm | null>(null)

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
      case 'mortality':
        setMortalityDialogOpen(true)
        break
    }
  }

  return {
    // Data
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
    feedDialogOpen,
    setFeedDialogOpen,
    eggDialogOpen,
    setEggDialogOpen,
    mortalityDialogOpen,
    setMortalityDialogOpen,
  }
}
