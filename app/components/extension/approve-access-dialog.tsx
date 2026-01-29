import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { Input } from '~/components/ui/input'
import { respondToAccessRequestFn } from '~/features/extension/server'
import { useToast } from '~/hooks/use-toast'

interface ApproveAccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestId: string
  onSuccess: () => void
}

export function ApproveAccessDialog({
  open,
  onOpenChange,
  requestId,
  onSuccess,
}: ApproveAccessDialogProps) {
  const { toast } = useToast()
  const [financialVisibility, setFinancialVisibility] = useState(false)
  const [durationDays, setDurationDays] = useState<number>(90)

  const approveMutation = useMutation({
    mutationFn: () =>
      respondToAccessRequestFn({
        data: {
          requestId,
          approved: true,
          financialVisibility,
          durationDays,
        },
      }),
    onSuccess: () => {
      toast({
        title: 'Access Approved',
        description: 'The extension worker can now access your farm data.',
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve access request',
        variant: 'destructive',
      })
    },
  })

  const handleApprove = () => {
    approveMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Approve Access Request
          </DialogTitle>
          <DialogDescription>
            Configure access permissions for this extension worker.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Financial Visibility Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="financial-visibility">Financial Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Allow access to sales, expenses, and financial reports
              </p>
            </div>
            <Switch
              id="financial-visibility"
              checked={financialVisibility}
              onCheckedChange={setFinancialVisibility}
            />
          </div>

          {/* Duration Override */}
          <div className="space-y-2">
            <Label htmlFor="duration">Access Duration (days)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              max={365}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Default is 90 days. Maximum is 365 days.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={approveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approveMutation.isPending}
            className="min-w-24"
          >
            {approveMutation.isPending ? 'Approving...' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
