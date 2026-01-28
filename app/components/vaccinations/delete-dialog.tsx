import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog'

interface DeleteHealthDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    isSubmitting: boolean
}

export function DeleteHealthDialog({
    open,
    onOpenChange,
    onConfirm,
    isSubmitting,
}: DeleteHealthDialogProps) {
    const { t } = useTranslation(['vaccinations', 'common'])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('common:delete')}</DialogTitle>
                    <DialogDescription>
                        {t('vaccinations:dialog.deleteDesc', {
                            defaultValue:
                                'Are you sure you want to delete this health record? This action cannot be undone.',
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
