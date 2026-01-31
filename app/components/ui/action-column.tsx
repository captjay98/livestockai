import { Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'

interface ActionColumnProps {
  onEdit?: () => void
  onDelete?: () => void
  onView?: () => void
  entity?: string
}

export function ActionColumn({
  onEdit,
  onDelete,
  onView,
  entity = 'item',
}: ActionColumnProps) {
  const { t } = useTranslation(['common'])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="h-8 w-8 p-0 bg-transparent border-none hover:bg-muted rounded-md flex items-center justify-center"
        aria-label={t('common:a11y.actionsFor', {
          entity,
          defaultValue: 'Actions for {{entity}}',
        })}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            {t('common:a11y.view', { defaultValue: 'View' })}
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            {t('common:a11y.edit', { defaultValue: 'Edit' })}
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            {t('common:a11y.delete', { defaultValue: 'Delete' })}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
