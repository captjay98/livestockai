import type { DashboardFarm } from '~/features/dashboard/types'
import { ExpenseDialog } from '~/components/expenses/expense-dialog'
import { EditFarmDialog } from '~/components/farms/edit-farm-dialog'
import { BatchDialog } from '~/components/batches/batch-dialog'
import { FeedDialog } from '~/components/feed/feed-dialog'
import { MortalityDialog } from '~/components/mortality/mortality-dialog'
import { EggDialog } from '~/components/eggs/egg-dialog'

interface DashboardDialogsProps {
  selectedFarmId: string | null
  selectedFarmForEdit: DashboardFarm | null
  expenseDialogOpen: boolean
  setExpenseDialogOpen: (open: boolean) => void
  editFarmDialogOpen: boolean
  setEditFarmDialogOpen: (open: boolean) => void
  batchDialogOpen: boolean
  setBatchDialogOpen: (open: boolean) => void
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
