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

interface DeleteConfirmDialogProps {
  entityName: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting?: boolean
  children?: React.ReactNode
}

export function DeleteConfirmDialog({
  entityName,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  children,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation(['common'])

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('dialog.deleteTitle', {
              entity: entityName,
              defaultValue: 'Delete {{entity}}',
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('dialog.deleteDesc', {
              entity: entityName.toLowerCase(),
              defaultValue:
                'Are you sure you want to delete this {{entity}}? This action cannot be undone.',
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {children && <div className="py-4">{children}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? t('deleting') : t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
