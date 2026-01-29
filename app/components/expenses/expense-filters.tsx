import { useTranslation } from 'react-i18next'
import { getCategoryIcon } from './utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { EXPENSE_CATEGORIES } from '~/features/expenses/server'

interface ExpenseFiltersProps {
  category?: string
  onCategoryChange: (category?: string) => void
}

export function ExpenseFilters({
  category,
  onCategoryChange,
}: ExpenseFiltersProps) {
  const { t } = useTranslation(['expenses', 'common'])

  return (
    <Select
      value={category || 'all'}
      onValueChange={(value) =>
        onCategoryChange(value === 'all' || value === null ? undefined : value)
      }
    >
      <SelectTrigger className="w-[180px] h-10">
        <SelectValue placeholder={t('labels.allCategories')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t('labels.allCategories')}</SelectItem>
        {EXPENSE_CATEGORIES.map((cat) => (
          <SelectItem key={cat.value} value={cat.value}>
            <div className="flex items-center gap-2">
              {getCategoryIcon(cat.value)}
              {t('categories.' + cat.value, {
                defaultValue: cat.label,
              })}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
