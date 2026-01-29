import { useTranslation } from 'react-i18next'
import { Ban, Shield, Users } from 'lucide-react'
import type { UserData } from './types'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface UserStatsProps {
  users: Array<UserData>
}

export function UserStats({ users }: UserStatsProps) {
  const { t } = useTranslation(['settings'])

  const totalUsers = users.length
  const adminUsers = users.filter((u) => u.role === 'admin').length
  const bannedUsers = users.filter((u) => u.banned).length

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('users.stats.total')}
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('users.stats.admins')}
          </CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{adminUsers}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('users.stats.banned')}
          </CardTitle>
          <Ban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{bannedUsers}</div>
        </CardContent>
      </Card>
    </div>
  )
}
