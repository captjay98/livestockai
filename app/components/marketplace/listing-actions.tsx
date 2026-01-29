import {
  CheckCircle,
  Clock,
  Edit,
  MoreHorizontal,
  Pause,
  Play,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ListingRecord } from '~/features/marketplace/repository'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

interface ListingActionsProps {
  listing: ListingRecord
  onAction: (action: string) => void
}

export function ListingActions({ listing, onAction }: ListingActionsProps) {
  const { t } = useTranslation('marketplace')

  const getAvailableActions = () => {
    const actions = []

    actions.push({ key: 'edit', label: t('actions.edit'), icon: Edit })

    if (listing.status === 'active') {
      actions.push({
        key: 'pause',
        label: t('actions.pause'),
        icon: Pause,
      })
      actions.push({
        key: 'mark-sold',
        label: t('actions.markAsSold'),
        icon: CheckCircle,
      })
    }

    if (listing.status === 'paused') {
      actions.push({
        key: 'resume',
        label: t('actions.resume'),
        icon: Play,
      })
    }

    if (listing.status === 'active' || listing.status === 'paused') {
      actions.push({
        key: 'extend',
        label: t('actions.extend'),
        icon: Clock,
      })
    }

    actions.push({
      key: 'delete',
      label: t('actions.delete'),
      icon: Trash2,
    })

    return actions
  }

  const actions = getAvailableActions()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.key}
            onClick={() => onAction(action.key)}
            className="flex items-center gap-2"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
