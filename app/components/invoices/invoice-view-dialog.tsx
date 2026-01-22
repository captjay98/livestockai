import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { InvoiceRecord } from '~/features/invoices/types'
import { useFormatCurrency, useFormatDate } from '~/features/settings'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

interface InvoiceViewDialogProps {
  invoice: InvoiceRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvoiceViewDialog({
  invoice,
  open,
  onOpenChange,
}: InvoiceViewDialogProps) {
  const { t } = useTranslation(['invoices', 'common'])
  const { format: formatCurrency } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('labels.invoice', { defaultValue: 'Invoice' })}{' '}
            {invoice?.invoiceNumber}
          </DialogTitle>
          <DialogDescription>{invoice?.customerName}</DialogDescription>
        </DialogHeader>
        {invoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t('labels.date')}</p>
                <p className="font-medium">{formatDate(invoice.date)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('labels.dueDate')}</p>
                <p className="font-medium">
                  {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('labels.amount')}</p>
                <p className="font-medium">
                  {formatCurrency(invoice.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('labels.status')}</p>
                <Badge
                  variant={
                    invoice.status === 'paid'
                      ? 'default'
                      : invoice.status === 'partial'
                        ? 'secondary'
                        : 'destructive'
                  }
                  className={
                    invoice.status === 'paid'
                      ? 'bg-success/15 text-success'
                      : invoice.status === 'partial'
                        ? 'bg-warning/15 text-warning'
                        : 'bg-destructive/15 text-destructive'
                  }
                >
                  {t('status.' + invoice.status, {
                    defaultValue: invoice.status,
                  })}
                </Badge>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.close')}
              </Button>
              <Button asChild>
                <Link to={`/invoices/${invoice.id}` as any}>
                  {t('viewFull')}
                </Link>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
