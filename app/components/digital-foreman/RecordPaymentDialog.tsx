import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { recordPaymentFn } from '~/features/digital-foreman/server-payroll'
import { useFormatCurrency } from '~/features/settings'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'

interface Worker {
  id: string
  userName: string | null
  balance: number
}

interface RecordPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workers: Array<Worker>
  payrollPeriodId: string
  preselectedWorkerId?: string
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  workers,
  payrollPeriodId,
  preselectedWorkerId,
}: RecordPaymentDialogProps) {
  const { t } = useTranslation(['digitalForeman'])
  const queryClient = useQueryClient()
  const { format, symbol } = useFormatCurrency()
  const [workerId, setWorkerId] = useState(preselectedWorkerId || '')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'bank_transfer' | 'mobile_money'
  >('cash')
  const [notes, setNotes] = useState('')

  const selectedWorker = workers.find((w) => w.id === workerId)

  const recordPayment = useMutation({
    mutationFn: recordPaymentFn,
    onSuccess: () => {
      toast.success(
        t('digitalForeman:messages.paymentRecorded', {
          defaultValue: 'Payment recorded successfully',
        }),
      )
      queryClient.invalidateQueries({ queryKey: ['payroll-summary'] })
      onOpenChange(false)
      resetForm()
    },
    onError: () =>
      toast.error(
        t('digitalForeman:messages.paymentRecordFailed', {
          defaultValue: 'Failed to record payment',
        }),
      ),
  })

  const resetForm = () => {
    setWorkerId(preselectedWorkerId || '')
    setAmount('')
    setPaymentMethod('cash')
    setNotes('')
  }

  const handleSubmit = () => {
    if (!workerId || !amount || Number(amount) <= 0) {
      toast.error(
        t('digitalForeman:messages.fillRequiredFields', {
          defaultValue: 'Please fill in all required fields',
        }),
      )
      return
    }

    recordPayment.mutate({
      data: {
        workerId,
        payrollPeriodId,
        amount: Number(amount),
        paymentMethod,
        paymentDate: new Date(),
        notes: notes || undefined,
      },
    })
  }

  const handlePayFullBalance = () => {
    if (selectedWorker && selectedWorker.balance > 0) {
      setAmount(selectedWorker.balance.toString())
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="worker">Worker</Label>
            <Select
              value={workerId}
              onValueChange={(value) => setWorkerId(value || '')}
            >
              <SelectTrigger className="h-11">
                <SelectValue
                  placeholder={t('digitalForeman:placeholders.selectWorker', {
                    defaultValue: 'Select worker',
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.userName || 'Unknown'} ({format(worker.balance)}{' '}
                    due)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedWorker && selectedWorker.balance > 0 && (
            <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">
                  Outstanding Balance
                </div>
                <div className="text-lg font-bold">
                  {format(selectedWorker.balance)}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePayFullBalance}
              >
                Pay Full
              </Button>
            </div>
          )}

          <div>
            <Label htmlFor="amount">Amount ({symbol})</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('digitalForeman:placeholders.amount', {
                defaultValue: '0.00',
              })}
              className="h-11"
            />
          </div>

          <div>
            <Label htmlFor="method">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('digitalForeman:placeholders.paymentNotes', {
                defaultValue: 'Add any notes about this payment...',
              })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={recordPayment.isPending}
            className="min-h-[48px]"
          >
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
