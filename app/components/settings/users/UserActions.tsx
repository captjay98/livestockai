import { useTranslation } from 'react-i18next'
import {
  Ban,
  Building2,
  Check,
  KeyRound,
  MoreHorizontal,
  Shield,
  ShieldOff,
  Trash2,
} from 'lucide-react'
import type { UserData } from './types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

interface UserActionsProps {
  user: UserData
  currentUserId: string
  isLoading: boolean
  onManageFarms: (user: UserData) => void
  onResetPassword: (user: UserData) => void
  onToggleAdmin: (userId: string, currentRole: string) => void
  onBanUser: (user: UserData) => void
  onUnbanUser: (userId: string) => void
  onDeleteUser: (user: UserData) => void
}

export function UserActions({
  user,
  currentUserId,
  isLoading,
  onManageFarms,
  onResetPassword,
  onToggleAdmin,
  onBanUser,
  onUnbanUser,
  onDeleteUser,
}: UserActionsProps) {
  const { t } = useTranslation(['settings'])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="h-10 w-10 p-0 bg-transparent border-none hover:bg-muted rounded-md flex items-center justify-center"
        disabled={isLoading}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Manage Farm Assignments */}
        <DropdownMenuItem onClick={() => onManageFarms(user)}>
          <Building2 className="h-4 w-4 mr-2" />
          {t('users.actions.manageFarms')}
        </DropdownMenuItem>

        {/* Reset Password */}
        <DropdownMenuItem onClick={() => onResetPassword(user)}>
          <KeyRound className="h-4 w-4 mr-2" />
          {t('users.actions.resetPassword')}
        </DropdownMenuItem>

        {/* Toggle Admin (not for self) */}
        {user.id !== currentUserId && (
          <DropdownMenuItem onClick={() => onToggleAdmin(user.id, user.role)}>
            {user.role === 'admin' ? (
              <>
                <ShieldOff className="h-4 w-4 mr-2" />
                {t('users.actions.removeAdmin')}
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                {t('users.actions.makeAdmin')}
              </>
            )}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Ban/Unban (not for self or admins) */}
        {user.id !== currentUserId &&
          user.role !== 'admin' &&
          (user.banned ? (
            <DropdownMenuItem onClick={() => onUnbanUser(user.id)}>
              <Check className="h-4 w-4 mr-2" />
              {t('users.actions.unban')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onBanUser(user)}>
              <Ban className="h-4 w-4 mr-2" />
              {t('users.actions.ban')}
            </DropdownMenuItem>
          ))}

        {/* Delete (not for self or admins) */}
        {user.id !== currentUserId && user.role !== 'admin' && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDeleteUser(user)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('users.actions.delete')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
