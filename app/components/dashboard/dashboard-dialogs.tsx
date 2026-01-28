import type { DashboardFarm } from '~/features/dashboard/types'
import { ExpenseDialog } from '~/components/dialogs/expense-dialog'
import { EditFarmDialog } from '~/components/dialogs/edit-farm-dialog'
import { BatchDialog } from '~/components/dialogs/batch-dialog'
import { SaleDialog } from '~/components/dialogs/sale-dialog'
import { FeedDialog } from '~/components/dialogs/feed-dialog'
import { MortalityDialog } from '~/components/dialogs/mortality-dialog'
import { EggDialog } from '~/components/dialogs/egg-dialog'

interface DashboardDialogsProps {
    selectedFarmId: string | null
    selectedFarmForEdit: DashboardFarm | null
    expenseDialogOpen: boolean
    setExpenseDialogOpen: (open: boolean) => void
    editFarmDialogOpen: boolean
    setEditFarmDialogOpen: (open: boolean) => void
    batchDialogOpen: boolean
    setBatchDialogOpen: (open: boolean) => void
    saleDialogOpen: boolean
    setSaleDialogOpen: (open: boolean) => void
    feedDialogOpen: boolean
    setFeedDialogOpen: (open: boolean) => void
    eggDialogOpen: boolean
    setEggDialogOpen: (open: boolean) => void
    mortalityDialogOpen: boolean
    setMortalityDialogOpen: (open: boolean) => void
}

export function DashboardDialogs({
    selectedFarmId,
    selectedFarmForEdit,
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
}: DashboardDialogsProps) {
    return (
        <>
            {selectedFarmId && (
                <>
                    <ExpenseDialog
                        farmId={selectedFarmId}
                        open={expenseDialogOpen}
                        onOpenChange={setExpenseDialogOpen}
                    />
                    <BatchDialog
                        open={batchDialogOpen}
                        onOpenChange={setBatchDialogOpen}
                    />
                    <SaleDialog
                        farmId={selectedFarmId}
                        open={saleDialogOpen}
                        onOpenChange={setSaleDialogOpen}
                    />
                    <FeedDialog
                        farmId={selectedFarmId}
                        open={feedDialogOpen}
                        onOpenChange={setFeedDialogOpen}
                    />
                    <EggDialog
                        farmId={selectedFarmId}
                        open={eggDialogOpen}
                        onOpenChange={setEggDialogOpen}
                    />
                    <MortalityDialog
                        open={mortalityDialogOpen}
                        onOpenChange={setMortalityDialogOpen}
                    />
                </>
            )}
            {selectedFarmForEdit && (
                <EditFarmDialog
                    farmId={selectedFarmForEdit.id}
                    open={editFarmDialogOpen}
                    onOpenChange={setEditFarmDialogOpen}
                />
            )}
        </>
    )
}
