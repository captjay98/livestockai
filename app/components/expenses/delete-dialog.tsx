import { useTranslation } from 'react-i18next'
import type { Expense } from './expense-columns'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

interface DeleteExpenseDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    expense: Expense | null
    onConfirm: () => void
    isSubmitting: boolean
}

export function DeleteExpenseDialog({
    open,
    onOpenChange,
    expense: _expense,
    onConfirm,
    isSubmitting,
}: DeleteExpenseDialogProps) {
    const { t } = useTranslation(['expenses', 'common'])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {t('dialog.deleteTitle', {
                            defaultValue: 'Delete Expense',
                        })}
                    </DialogTitle>
                    <DialogDescription>
                        {t('dialog.deleteDesc', {
                            defaultValue:
                                'Are you sure you want to delete this expense? This action cannot be undone.',
                        })}
                    </DialogDescription>
                </DialogHeader>
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
                        {isSubmitting
                            ? t('common:deleting')
                            : t('common:delete')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
