import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog'

interface WeightDeleteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => Promise<void>
    isSubmitting: boolean
}

export function WeightDeleteDialog({
    open,
    onOpenChange,
    onConfirm,
    isSubmitting,
}: WeightDeleteDialogProps) {
    const { t } = useTranslation(['weight', 'common'])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {t('weight:deleteSampleTitle', {
                            defaultValue: 'Delete Weight Sample',
                        })}
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    {t('weight:deleteConfirmation', {
                        defaultValue:
                            'Are you sure you want to delete this weight sample?',
                    })}
                </p>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        {t('common:cancel', { defaultValue: 'Cancel' })}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? t('common:deleting', {
                                  defaultValue: 'Deleting...',
                              })
                            : t('common:delete', { defaultValue: 'Delete' })}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
