import { Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

interface WaterQualityFiltersProps {
    dateRange?: 'all' | 'week' | 'month'
    onDateRangeChange?: (dateRange: 'all' | 'week' | 'month') => void
    onClearFilters?: () => void
}

export function WaterQualityFilters({
    dateRange = 'all',
    onDateRangeChange,
    onClearFilters,
}: WaterQualityFiltersProps) {
    const { t } = useTranslation(['waterQuality', 'common'])

    const hasActiveFilters = dateRange !== 'all'

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        {t('common:filters', { defaultValue: 'Filters' })}
                        {hasActiveFilters && (
                            <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1">
                                1
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>
                        {t('waterQuality:filterBy', {
                            defaultValue: 'Filter by',
                        })}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                        value={dateRange}
                        onValueChange={(value) =>
                            onDateRangeChange?.(
                                value as 'all' | 'week' | 'month',
                            )
                        }
                    >
                        <DropdownMenuRadioItem value="all">
                            {t('waterQuality:allRecords', {
                                defaultValue: 'All Records',
                            })}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="week">
                            {t('waterQuality:lastWeek', {
                                defaultValue: 'Last 7 Days',
                            })}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="month">
                            {t('waterQuality:lastMonth', {
                                defaultValue: 'Last 30 Days',
                            })}
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            {hasActiveFilters && onClearFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters}>
                    {t('common:clear', { defaultValue: 'Clear' })}
                </Button>
            )}
        </div>
    )
}
