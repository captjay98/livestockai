import { useTranslation } from 'react-i18next'
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

interface Batch {
    id: string
    species: string
    currentQuantity: number
    livestockType: string
}

interface BatchDeleteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    batch: Batch | null
    onConfirm: () => Promise<void>
    isSubmitting: boolean
}

export function BatchDeleteDialog({
    open,
    onOpenChange,
    batch,
    onConfirm,
    isSubmitting,
}: BatchDeleteDialogProps) {
    const { t } = useTranslation(['batches', 'common'])

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {t('dialog.deleteTitle', {
                            defaultValue: 'Delete Batch',
                        })}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('dialog.deleteDescription', {
                            defaultValue:
                                'Are you sure you want to delete this batch? This action cannot be undone.',
                        })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {batch && (
                    <div className="p-4 bg-muted rounded-lg text-sm">
                        <p className="font-medium capitalize">
                            {batch.species}
                        </p>
                        <p className="text-muted-foreground">
                            {t('batches:quantityUnits', {
                                count: batch.currentQuantity,
                                defaultValue: '{{count}} units',
                            })}{' '}
                            • {batch.livestockType}
                        </p>
                    </div>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>
                        {t('common:cancel', { defaultValue: 'Cancel' })}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onConfirm()
                        }}
                        disabled={isSubmitting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isSubmitting
                            ? t('common:deleting', {
                                  defaultValue: 'Deleting...',
                              })
                            : t('common:delete', { defaultValue: 'Delete' })}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
