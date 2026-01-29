import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface UserFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  roleFilter: string
  onRoleFilterChange: (role: string) => void
}

export function UserFilters({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
}: UserFiltersProps) {
  const { t } = useTranslation(['settings'])

  return (
    <div className="flex gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('users.search')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={roleFilter}
        onValueChange={(value) => onRoleFilterChange(value || '')}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('users.filters.all')}</SelectItem>
          <SelectItem value="admin">{t('users.roles.admin')}</SelectItem>
          <SelectItem value="user">{t('users.roles.user')}</SelectItem>
          <SelectItem value="banned">{t('users.status.banned')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
