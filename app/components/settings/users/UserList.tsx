import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Ban, Shield, Users } from 'lucide-react'
import { UserActions } from './UserActions'
import type { UserData } from './types'
import { Badge } from '~/components/ui/badge'
import { Card } from '~/components/ui/card'

interface UserListProps {
  users: Array<UserData>
  currentUserId: string
  isLoading: boolean
  onManageFarms: (user: UserData) => void
  onResetPassword: (user: UserData) => void
  onToggleAdmin: (userId: string, currentRole: string) => void
  onBanUser: (user: UserData) => void
  onUnbanUser: (userId: string) => void
  onDeleteUser: (user: UserData) => void
}

export function UserList({
  users,
  currentUserId,
  isLoading,
  onManageFarms,
  onResetPassword,
  onToggleAdmin,
  onBanUser,
  onUnbanUser,
  onDeleteUser,
}: UserListProps) {
  const { t } = useTranslation(['settings'])

  if (users.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">{t('users.empty.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('users.empty.descEmpty')}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <Card key={user.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-sm font-medium">
                  {user.name?.charAt(0).toUpperCase() ||
                    user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {user.name || t('users.unnamed')}
                  </span>
                  {user.role === 'admin' && (
                    <Badge variant="default" className="shrink-0">
                      <Shield className="h-3 w-3 mr-1" />
                      {t('users.roles.admin')}
                    </Badge>
                  )}
                  {user.banned && (
                    <Badge variant="destructive" className="shrink-0">
                      <Ban className="h-3 w-3 mr-1" />
                      {t('users.status.banned')}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('users.status.joined')}{' '}
                  {format(new Date(user.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <UserActions
              user={user}
              currentUserId={currentUserId}
              isLoading={isLoading}
              onManageFarms={onManageFarms}
              onResetPassword={onResetPassword}
              onToggleAdmin={onToggleAdmin}
              onBanUser={onBanUser}
              onUnbanUser={onUnbanUser}
              onDeleteUser={onDeleteUser}
            />
          </div>

          {/* Show ban reason if banned */}
          {user.banned && user.banReason && (
            <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
              <span className="font-medium">{t('users.banReason')}:</span>{' '}
              {user.banReason}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
