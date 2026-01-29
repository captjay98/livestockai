import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { XCircle } from 'lucide-react'
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
import { Textarea } from '~/components/ui/textarea'
import { respondToAccessRequestFn } from '~/features/extension/server'
import { useToast } from '~/hooks/use-toast'

interface DenyAccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestId: string
  onSuccess: () => void
}

export function DenyAccessDialog({
  open,
  onOpenChange,
  requestId,
  onSuccess,
}: DenyAccessDialogProps) {
  const { toast } = useToast()
  const [reason, setReason] = useState('')

  const denyMutation = useMutation({
    mutationFn: () =>
      respondToAccessRequestFn({
        data: {
          requestId,
          approved: false,
          reason: reason || undefined,
        },
      }),
    onSuccess: () => {
      toast({
        title: 'Access Denied',
        description: 'The access request has been denied.',
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deny access request',
        variant: 'destructive',
      })
    },
  })

  const handleDeny = () => {
    denyMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Deny Access Request
          </DialogTitle>
          <DialogDescription>
            Provide an optional reason for denying this request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Not authorized by farm management"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={denyMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeny}
            disabled={denyMutation.isPending}
            className="min-w-24"
          >
            {denyMutation.isPending ? 'Denying...' : 'Deny Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
