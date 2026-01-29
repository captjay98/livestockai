import { useTranslation } from 'react-i18next'
import {
  Bird,
  Edit,
  Fish,
  Hammer,
  Megaphone,
  Package,
  Pill,
  Settings,
  Trash2,
  Truck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

interface Expense {
  id: string
  farmId?: string
  farmName?: string | null
  category: string
  amount: string
  date: Date
  description: string
  supplierName: string | null
  batchSpecies: string | null
  batchType?: string | null
  isRecurring: boolean
}

interface ExpenseDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
  formatCurrency: (value: string | number) => string
  formatDate: (date: Date) => string
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  feed: <Package className="h-4 w-4" />,
  medicine: <Pill className="h-4 w-4" />,
  equipment: <Wrench className="h-4 w-4" />,
  utilities: <Zap className="h-4 w-4" />,
  labor: <Users className="h-4 w-4" />,
  transport: <Truck className="h-4 w-4" />,
  livestock: <Bird className="h-4 w-4" />,
  livestock_chicken: <Bird className="h-4 w-4" />,
  livestock_fish: <Fish className="h-4 w-4" />,
  maintenance: <Hammer className="h-4 w-4" />,
  marketing: <Megaphone className="h-4 w-4" />,
  other: <Settings className="h-4 w-4" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  feed: 'text-primary bg-primary/10',
  medicine: 'text-destructive bg-destructive/10',
  equipment: 'text-info bg-info/10',
  utilities: 'text-warning bg-warning/10',
  labor: 'text-purple bg-purple/10',
  transport: 'text-success bg-success/10',
  livestock: 'text-warning bg-warning/10',
  livestock_chicken: 'text-primary bg-primary/10',
  livestock_fish: 'text-info bg-info/10',
  maintenance: 'text-slate bg-slate/10',
  marketing: 'text-purple bg-purple/10',
  other: 'text-muted-foreground bg-muted',
}

export function ExpenseDetailsDialog({
  open,
  onOpenChange,
  expense,
  formatCurrency,
  formatDate,
  onEdit,
  onDelete,
}: ExpenseDetailsDialogProps) {
  const { t } = useTranslation(['expenses', 'common'])

  if (!expense) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('dialog.detailsTitle', {
              defaultValue: 'Expense Details',
            })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${CATEGORY_COLORS[expense.category] || 'bg-gray-100'}`}
            >
              {CATEGORY_ICONS[expense.category] || (
                <Settings className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="font-semibold text-lg capitalize">
                {t('categories.' + expense.category, {
                  defaultValue: expense.category,
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {expense.description}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('labels.amount')}:
              </span>
              <span className="font-bold text-lg text-destructive">
                -{formatCurrency(parseFloat(expense.amount))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('labels.date')}:</span>
              <Badge variant="outline">{formatDate(expense.date)}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('labels.supplier')}:
              </span>
              <span className="font-medium">{expense.supplierName || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('labels.batch')}:
              </span>
              <span className="font-medium">{expense.batchSpecies || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('labels.recurring')}:
              </span>
              <Badge variant={expense.isRecurring ? 'default' : 'secondary'}>
                {expense.isRecurring ? t('common.yes') : t('common.no')}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                onEdit(expense)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onOpenChange(false)
                onDelete(expense)
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
