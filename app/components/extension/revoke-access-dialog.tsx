import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import { revokeAccessFn } from '~/features/extension/server'

interface RevokeAccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  grantId: string
  onSuccess: () => void
}

export function RevokeAccessDialog({
  open,
  onOpenChange,
  grantId,
  onSuccess,
}: RevokeAccessDialogProps) {
  const { t } = useTranslation(['extension', 'common'])
  const [reason, setReason] = useState('')

  const revokeMutation = useMutation({
    mutationFn: () =>
      revokeAccessFn({
        data: {
          grantId,
          reason: reason || undefined,
        },
      }),
    onSuccess: () => {
      toast.success(
        t('extension:messages.accessRevoked', {
          defaultValue: 'Access Revoked',
        }),
        {
          description: t('extension:messages.accessRevokedDesc', {
            defaultValue:
              'The extension worker no longer has access to your farm.',
          }),
        },
      )
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(
        t('extension:messages.error', {
          defaultValue: 'Error',
        }),
        {
          description:
            error.message ||
            t('extension:messages.revokeAccessFailed', {
              defaultValue: 'Failed to revoke access',
            }),
        },
      )
    },
  })

  const handleRevoke = () => {
    revokeMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Revoke Farm Access
          </DialogTitle>
          <DialogDescription>
            This will immediately remove the extension worker's access to your
            farm data. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="revoke-reason">Reason (Optional)</Label>
            <Textarea
              id="revoke-reason"
              placeholder={t('placeholders.revokeReason', {
                defaultValue: 'e.g., Access no longer needed',
              })}
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

          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">⚠️ Warning</p>
            <p className="mt-1">
              The extension worker will be notified and will lose access
              immediately.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={revokeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={revokeMutation.isPending}
            className="min-w-24"
          >
            {revokeMutation.isPending ? 'Revoking...' : 'Revoke Access'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
