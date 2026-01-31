import {
  AlertTriangle,
  Droplets,
  HeartPulse,
  Receipt,
  ShoppingCart,
  Wheat,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from '@tanstack/react-router'
import { logger } from '~/lib/logger'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { StepperInput } from '~/components/ui/stepper-input'
import { FeedDialog } from '~/components/feed/feed-dialog'
import { MortalityDialog } from '~/components/mortality/mortality-dialog'
import { ExpenseDialog } from '~/components/expenses/expense-dialog'

interface BatchCommandCenterProps {
  batchId: string
  farmId: string
}

export function BatchCommandCenter({
  batchId: _batchId,
  farmId,
}: BatchCommandCenterProps) {
  const { t } = useTranslation(['common', 'batches'])
  const router = useRouter()

  // Dialog states
  const [feedDialogOpen, setFeedDialogOpen] = useState(false)
  const [mortalityDialogOpen, setMortalityDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)

  // Quick Log States (legacy - keeping for quick feed)
  const [quickFeedOpen, setQuickFeedOpen] = useState(false)
  const [feedAmount, setFeedAmount] = useState(0)

  return (
    <div className="space-y-6">
      {/* Daily Actions Section */}
      <section>
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 tracking-widest px-1">
          {t('common:dailyActions', {
            defaultValue: 'Daily Actions',
          })}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 hover:bg-white/40 dark:hover:bg-black/40 transition-all rounded-2xl group shadow-sm"
            onClick={() => setFeedDialogOpen(true)}
          >
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Wheat className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-sm font-bold tracking-tight">
              {t('common:logFeed', { defaultValue: 'Log Feed' })}
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 hover:bg-white/40 dark:hover:bg-black/40 transition-all rounded-2xl group shadow-sm"
            onClick={() => logger.debug('Log Water')} // Placeholder
          >
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Droplets className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-sm font-bold tracking-tight">
              {t('common:logWater', { defaultValue: 'Log Water' })}
            </span>
          </Button>
        </div>
      </section>

      {/* Incident Reporting Section */}
      <section>
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 tracking-widest px-1">
          {t('common:incidents', { defaultValue: 'Incidents' })}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-1 bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 hover:bg-white/40 dark:hover:bg-black/40 transition-all rounded-2xl group shadow-sm"
            onClick={() => setMortalityDialogOpen(true)}
          >
            <HeartPulse className="h-5 w-5 text-red-500 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">
              {t('common:mortality', { defaultValue: 'Mortality' })}
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-1 bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 hover:bg-white/40 dark:hover:bg-black/40 transition-all rounded-2xl group shadow-sm"
            onClick={() => logger.debug('Log Symptoms')}
          >
            <AlertTriangle className="h-5 w-5 text-yellow-500 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">
              {t('common:symptoms', { defaultValue: 'Symptoms' })}
            </span>
          </Button>
        </div>
      </section>

      {/* Financials Section */}
      <section>
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 tracking-widest px-1">
          {t('common:financials', { defaultValue: 'Financials' })}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-16 flex items-center justify-start px-4 gap-3 bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 hover:bg-white/40 dark:hover:bg-black/40 transition-all rounded-2xl group shadow-sm"
            onClick={() => router.navigate({ to: '/sales' })}
          >
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold tracking-tight">
              {t('common:newSale', { defaultValue: 'New Sale' })}
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-16 flex items-center justify-start px-4 gap-3 bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 hover:bg-white/40 dark:hover:bg-black/40 transition-all rounded-2xl group shadow-sm"
            onClick={() => setExpenseDialogOpen(true)}
          >
            <div className="p-1.5 rounded-lg bg-muted/20 text-muted-foreground group-hover:scale-110 transition-transform">
              <Receipt className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold tracking-tight">
              {t('common:newExpense', { defaultValue: 'New Expense' })}
            </span>
          </Button>
        </div>
      </section>

      {/* Quick Feed Dialog - Legacy, keeping for reference */}
      <Dialog open={quickFeedOpen} onOpenChange={setQuickFeedOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="bg-white/10 dark:bg-black/20 p-6 -mx-6 -mt-6 rounded-t-lg border-b border-white/10 backdrop-blur-sm">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600">
                <Wheat className="h-5 w-5" />
              </div>
              {t('common:logFeed', {
                defaultValue: 'Log Feed Consumed',
              })}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              How many bags/kg did you feed?
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <StepperInput
              value={feedAmount}
              onChange={setFeedAmount}
              label="Quantity"
              unit="kg"
              quickAddAmounts={[10, 25, 50]}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setQuickFeedOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Submit logic here
                logger.debug('Submitted Feed:', feedAmount)
                setQuickFeedOpen(false)
                setFeedAmount(0)
              }}
            >
              Save Log
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feed Dialog */}
      <FeedDialog
        farmId={farmId}
        open={feedDialogOpen}
        onOpenChange={setFeedDialogOpen}
      />

      {/* Mortality Dialog */}
      <MortalityDialog
        open={mortalityDialogOpen}
        onOpenChange={setMortalityDialogOpen}
        onSuccess={() => router.invalidate()}
      />

      {/* Expense Dialog */}
      <ExpenseDialog
        farmId={farmId}
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
      />
    </div>
  )
}
