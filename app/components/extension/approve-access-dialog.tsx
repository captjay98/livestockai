import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
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
import { Switch } from '~/components/ui/switch'
import { Input } from '~/components/ui/input'
import { respondToAccessRequestFn } from '~/features/extension/server'

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
  const { t } = useTranslation(['extension', 'common'])
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
      toast.success(
        t('extension:messages.accessApproved', {
          defaultValue: 'Access Approved',
        }),
        {
          description: t('extension:messages.accessApprovedDesc', {
            defaultValue: 'The extension worker can now access your farm data.',
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
            t('extension:messages.approveAccessFailed', {
              defaultValue: 'Failed to approve access request',
            }),
        },
      )
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
            {t('approveAccessRequest', {
              defaultValue: 'Approve Access Request',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('configurePermissions', {
              defaultValue:
                'Configure access permissions for this extension worker.',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Financial Visibility Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="financial-visibility">
                {t('financialVisibility', {
                  defaultValue: 'Financial Visibility',
                })}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('financialVisibilityDesc', {
                  defaultValue:
                    'Allow access to sales, expenses, and financial reports',
                })}
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
            <Label htmlFor="duration">
              {t('accessDurationDays', {
                defaultValue: 'Access Duration (days)',
              })}
            </Label>
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
              {t('accessDurationHint', {
                defaultValue: 'Default is 90 days. Maximum is 365 days.',
              })}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={approveMutation.isPending}
          >
            {t('common:cancel')}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approveMutation.isPending}
            className="min-w-24"
          >
            {approveMutation.isPending
              ? t('approving', { defaultValue: 'Approving...' })
              : t('approve', { defaultValue: 'Approve' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
