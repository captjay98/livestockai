import { useTranslation } from 'react-i18next'
import { TYPE_COLORS, getTypeIcon } from './utils'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

interface DeleteSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isSubmitting: boolean
  sale: {
    livestockType: string
    totalAmount: string | number
    quantity: number
  } | null
  formatCurrency: (amount: number) => string
}

export function DeleteSaleDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  sale,
  formatCurrency,
}: DeleteSaleDialogProps) {
  const { t } = useTranslation(['common', 'sales'])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('dialog.deleteTitle', { defaultValue: 'Delete Sale' })}
          </DialogTitle>
          <DialogDescription>
            {t('dialog.deleteDesc', {
              defaultValue:
                'Are you sure you want to delete this sale? This action cannot be undone.',
            })}
          </DialogDescription>
        </DialogHeader>
        {sale && (
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${TYPE_COLORS[sale.livestockType] || 'bg-gray-100'}`}
              >
                {getTypeIcon(sale.livestockType)}
              </div>
              <div>
                <p className="font-medium capitalize">
                  {t('sales:saleTypeDescription', {
                    type: sale.livestockType,
                    defaultValue: '{{type}} Sale',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(Number(sale.totalAmount))} -{' '}
                  {t('sales:quantityUnits', {
                    count: sale.quantity,
                    defaultValue: '{{count}} units',
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common:cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('common:deleting') : t('common:delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
