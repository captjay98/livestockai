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
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { StepperInput } from '~/components/ui/stepper-input'

interface BatchCommandCenterProps {
  batchId: string
}

export function BatchCommandCenter({
  batchId: _batchId,
}: BatchCommandCenterProps) {
  const { t } = useTranslation(['common', 'batches'])

  // Quick Log States
  const [quickFeedOpen, setQuickFeedOpen] = useState(false)
  const [feedAmount, setFeedAmount] = useState(0)

  return (
    <div className="space-y-6">
      {/* Daily Actions Section */}
      <section>
        <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3 tracking-wider">
          {t('common:dailyActions', { defaultValue: 'Daily Actions' })}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all font-semibold"
            onClick={() => setQuickFeedOpen(true)}
          >
            <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center shadow-sm">
              <Wheat className="h-5 w-5 text-orange-600" />
            </div>
            {t('common:logFeed', { defaultValue: 'Log Feed' })}
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all font-semibold"
            onClick={() => console.log('Log Water')} // Placeholder
          >
            <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center shadow-sm">
              <Droplets className="h-5 w-5 text-blue-500" />
            </div>
            {t('common:logWater', { defaultValue: 'Log Water' })}
          </Button>
        </div>
      </section>

      {/* Incident Reporting Section */}
      <section>
        <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3 tracking-wider">
          {t('common:incidents', { defaultValue: 'Incidents' })}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-1 border-red-500/10 hover:bg-red-500/5 transition-all text-muted-foreground hover:text-foreground"
            onClick={() => console.log('Log Mortality')}
          >
            <HeartPulse className="h-5 w-5 text-red-500 mb-1" />
            {t('common:mortality', { defaultValue: 'Mortality' })}
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-1 hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
            onClick={() => console.log('Log Symptoms')}
          >
            <AlertTriangle className="h-5 w-5 text-yellow-500 mb-1" />
            {t('common:symptoms', { defaultValue: 'Symptoms' })}
          </Button>
        </div>
      </section>

      {/* Financials Section */}
      <section>
        <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3 tracking-wider">
          {t('common:financials', { defaultValue: 'Financials' })}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-16 flex items-center justify-start px-4 gap-3"
            onClick={() => console.log('New Sale')}
          >
            <ShoppingCart className="h-4 w-4 text-emerald-600" />
            {t('common:newSale', { defaultValue: 'New Sale' })}
          </Button>
          <Button
            variant="outline"
            className="h-16 flex items-center justify-start px-4 gap-3"
            onClick={() => console.log('New Expense')}
          >
            <Receipt className="h-4 w-4 text-muted-foreground" />
            {t('common:newExpense', { defaultValue: 'New Expense' })}
          </Button>
        </div>
      </section>

      {/* Quick Feed Dialog */}
      <Dialog open={quickFeedOpen} onOpenChange={setQuickFeedOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('common:logFeed', { defaultValue: 'Log Feed Consumed' })}
            </DialogTitle>
            <DialogDescription>
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
                console.log('Submitted Feed:', feedAmount)
                setQuickFeedOpen(false)
                setFeedAmount(0)
              }}
            >
              Save Log
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
