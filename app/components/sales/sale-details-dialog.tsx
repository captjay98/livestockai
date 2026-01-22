import { useTranslation } from 'react-i18next'
import { Bird, Edit, Egg, Fish, ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  UNIT_TYPES,
} from '~/features/sales/server'

interface Sale {
  id: string
  farmId?: string
  farmName?: string | null
  customerId?: string | null
  livestockType: string
  batchSpecies: string | null
  totalAmount: string
  paymentStatus: string | null
  customerName: string | null
  quantity: number
  unitType: string | null
  unitPrice: string
  paymentMethod: string | null
  ageWeeks: number | null
  averageWeightKg: string | null
  date: Date
  notes: string | null
}

interface SaleDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: Sale | null
  formatCurrency: (value: string | number) => string
  formatDate: (date: Date) => string
  formatWeight: (weight: number) => string
  onEdit: (sale: Sale) => void
  onDelete: (sale: Sale) => void
}

export function SaleDetailsDialog({
  open,
  onOpenChange,
  sale,
  formatCurrency,
  formatDate,
  formatWeight,
  onEdit,
  onDelete,
}: SaleDetailsDialogProps) {
  const { t } = useTranslation(['sales', 'common'])

  if (!sale) return null

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'poultry':
        return <Bird className="h-4 w-4" />
      case 'fish':
        return <Fish className="h-4 w-4" />
      case 'eggs':
        return <Egg className="h-4 w-4" />
      default:
        return <ShoppingCart className="h-4 w-4" />
    }
  }

  const TYPE_COLORS: Record<string, string> = {
    poultry: 'text-primary bg-primary/10',
    fish: 'text-info bg-info/10',
    eggs: 'text-warning bg-warning/10',
  }

  const statusInfo =
    PAYMENT_STATUSES.find((s) => s.value === sale.paymentStatus) ||
    PAYMENT_STATUSES[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('dialog.detailsTitle', { defaultValue: 'Sale Details' })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${TYPE_COLORS[sale.livestockType] || 'bg-gray-100'}`}
            >
              {getTypeIcon(sale.livestockType)}
            </div>
            <div>
              <p className="font-semibold text-lg capitalize">
                {sale.livestockType} {t('labels.sale')}
              </p>
              <p className="text-sm text-muted-foreground">
                {sale.batchSpecies || t('placeholders.noBatch')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('labels.amount')}:
              </span>
              <span className="font-bold text-lg text-success">
                {formatCurrency(sale.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('labels.payment')}:
              </span>
              <Badge className={`${statusInfo.color} border-0`}>
                {statusInfo.label}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('labels.customer')}:
              </span>
              <span className="font-medium">
                {sale.customerName || t('placeholders.walkInCustomer')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('labels.quantity')}:
              </span>
              <span>
                {sale.quantity}{' '}
                {sale.unitType
                  ? UNIT_TYPES.find((u) => u.value === sale.unitType)?.label ||
                    sale.unitType
                  : t('common.units', { defaultValue: 'units' })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('labels.unitPrice')}:
              </span>
              <span>{formatCurrency(sale.unitPrice)}</span>
            </div>
            {sale.paymentMethod && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('labels.paymentMethod', {
                    defaultValue: 'Payment Method',
                  })}
                  :
                </span>
                <span>
                  {PAYMENT_METHODS.find((m) => m.value === sale.paymentMethod)
                    ?.label || sale.paymentMethod}
                </span>
              </div>
            )}
            {sale.ageWeeks && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('labels.ageAtSale', { defaultValue: 'Age at Sale' })}:
                </span>
                <span>{sale.ageWeeks} weeks</span>
              </div>
            )}
            {sale.averageWeightKg && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('labels.avgWeight', { defaultValue: 'Avg Weight' })}:
                </span>
                <span>{formatWeight(parseFloat(sale.averageWeightKg))}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('labels.date')}:</span>
              <span>{formatDate(sale.date)}</span>
            </div>
            {sale.notes && (
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  {t('labels.notes')}:
                </span>
                <p className="text-sm mt-1">{sale.notes}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                onEdit(sale)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onOpenChange(false)
                onDelete(sale)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
