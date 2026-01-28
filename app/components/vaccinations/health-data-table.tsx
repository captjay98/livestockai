import { Activity } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getHealthColumns } from './health-columns'
import { VaccinationFilters } from './vaccination-filters'
import type { HealthRecord } from './health-columns'
import type { PaginatedQuery } from '~/features/vaccinations/types'
import type { PaginatedResult } from '~/features/vaccinations/server'
import { useFormatDate } from '~/features/settings'
import { DataTable } from '~/components/ui/data-table'

interface HealthDataTableProps {
    paginatedRecords: PaginatedResult<HealthRecord>
    searchParams: PaginatedQuery
    isLoading: boolean
    onEdit: (record: HealthRecord) => void
    onDelete: (record: HealthRecord) => void
    onPaginationChange: (page: number, pageSize: number) => void
    onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
    onSearchChange: (search: string) => void
    onTypeChange: (type: string) => void
}

export function HealthDataTable({
    paginatedRecords,
    searchParams,
    isLoading,
    onEdit,
    onDelete,
    onPaginationChange,
    onSortChange,
    onSearchChange,
    onTypeChange,
}: HealthDataTableProps) {
    const { t } = useTranslation(['vaccinations'])
    const { format: formatDate } = useFormatDate()

    const columns = useMemo(
        () => getHealthColumns({ t, formatDate, onEdit, onDelete }),
        [t, formatDate, onEdit, onDelete],
    )

    return (
        <DataTable
            columns={columns}
            data={paginatedRecords.data}
            total={paginatedRecords.total}
            page={paginatedRecords.page}
            pageSize={paginatedRecords.pageSize}
            totalPages={paginatedRecords.totalPages}
            sortBy={searchParams.sortBy}
            sortOrder={searchParams.sortOrder}
            searchValue={searchParams.search}
            isLoading={isLoading}
            onPaginationChange={onPaginationChange}
            onSortChange={onSortChange}
            onSearchChange={onSearchChange}
            filters={
                <VaccinationFilters
                    type={searchParams.type || 'all'}
                    onTypeChange={onTypeChange}
                />
            }
            emptyIcon={<Activity className="h-12 w-12 text-muted-foreground" />}
            emptyTitle={t('empty.title')}
            emptyDescription={t('empty.description')}
        />
    )
}
