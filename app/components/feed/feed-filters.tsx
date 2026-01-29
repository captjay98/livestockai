import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { FEED_TYPES } from '~/features/feed/constants'

interface FeedFiltersProps {
  feedType?: string
  onFeedTypeChange: (feedType?: string) => void
}

export function FeedFilters({ feedType, onFeedTypeChange }: FeedFiltersProps) {
  const { t } = useTranslation(['feed', 'common'])

  return (
    <div className="flex gap-2">
      <Select
        value={feedType || 'all'}
        onValueChange={(value) =>
          value && onFeedTypeChange(value === 'all' ? undefined : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('filters.feedType')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common:all')}</SelectItem>
          {FEED_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
