import { useTranslation } from 'react-i18next'
import type { EggCollectionWithDetails } from '~/features/eggs/repository'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '~/components/ui/alert-dialog'

interface EggDeleteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    record: EggCollectionWithDetails | null
    onConfirm: () => Promise<boolean>
    isSubmitting: boolean
}

export function EggDeleteDialog({
    open,
    onOpenChange,
    record: _record,
    onConfirm,
    isSubmitting,
}: EggDeleteDialogProps) {
    const { t } = useTranslation(['common'])

    const handleConfirm = async (e: React.MouseEvent) => {
        e.preventDefault()
        const success = await onConfirm()
        if (success) onOpenChange(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('delete_confirm')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('delete_warning')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>
                        {t('cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="bg-destructive text-destructive-foreground"
                    >
                        {isSubmitting ? t('deleting') : t('delete')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
