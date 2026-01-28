import { useState } from 'react'
import type { FarmWithStats } from './types'

export function useFarmsPage(_farms: Array<FarmWithStats>) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedFarm, setSelectedFarm] = useState<FarmWithStats | null>(null)

    const handleCreate = () => {
        setSelectedFarm(null)
        setDialogOpen(true)
    }

    const handleEdit = (farm: FarmWithStats) => {
        setSelectedFarm(farm)
        setDialogOpen(true)
    }

    return {
        dialogOpen,
        setDialogOpen,
        selectedFarm,
        handleCreate,
        handleEdit,
    }
}
