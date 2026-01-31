import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import { Pagination } from './pagination'
import { Input } from './input'
import { Button } from './button'
import type { ColumnDef, SortingState } from '@tanstack/react-table'

interface DataTableProps<TData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>
  data: Array<TData>
  total: number
  page: number
  pageSize: number
  totalPages: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  searchValue?: string
  searchPlaceholder?: string
  isLoading?: boolean
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  filters?: React.ReactNode
  containerClassName?: string
  onPaginationChange: (page: number, pageSize: number) => void
  onSortChange: (column: string, order: 'asc' | 'desc') => void
  onSearchChange?: (value: string) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  total,
  page,
  pageSize,
  totalPages,
  sortBy,
  sortOrder,
  searchValue = '',
  searchPlaceholder = 'Search...',
  isLoading = false,
  emptyIcon,
  emptyTitle = 'No results found',
  emptyDescription = 'Try adjusting your search or filters.',
  filters,
  onPaginationChange,
  onSortChange,
  onSearchChange,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation(['common'])
  const [localSearch, setLocalSearch] = useState(searchValue)

  // Sync local search with prop
  useEffect(() => {
    setLocalSearch(searchValue)
  }, [searchValue])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchValue && onSearchChange) {
        onSearchChange(localSearch)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch])

  const sorting: SortingState = sortBy
    ? [{ id: sortBy, desc: sortOrder === 'desc' }]
    : []

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
    state: {
      sorting,
      pagination: { pageIndex: page - 1, pageSize },
    },
  })

  const handleSort = (columnId: string) => {
    const currentSort = sorting.find((s) => s.id === columnId)
    if (!currentSort) {
      onSortChange(columnId, 'asc')
    } else if (!currentSort.desc) {
      onSortChange(columnId, 'desc')
    } else {
      onSortChange(columnId, 'asc')
    }
  }

  const getSortIcon = (columnId: string) => {
    const currentSort = sorting.find((s) => s.id === columnId)
    if (!currentSort) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    }
    return currentSort.desc ? (
      <ArrowDown className="ml-2 h-4 w-4" />
    ) : (
      <ArrowUp className="ml-2 h-4 w-4" />
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4" role="search">
        {onSearchChange && (
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50"
              aria-hidden="true"
            />
            <Input
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 h-10 bg-white/40 dark:bg-black/40 backdrop-blur-md border-white/20 dark:border-white/10 focus:bg-white/60 dark:focus:bg-black/60 transition-all rounded-xl"
              aria-label={searchPlaceholder}
            />
          </div>
        )}
        {filters && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {filters}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/20 dark:border-white/10 overflow-hidden bg-white/30 dark:bg-black/30 backdrop-blur-md shadow-sm">
        {isLoading ? (
          <div
            className="flex items-center justify-center py-24"
            role="status"
            aria-label={t('common:loading', { defaultValue: 'Loading' })}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-primary/20"></div>
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse">
                Loading data...
              </p>
            </div>
            <span className="sr-only">Loading...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="py-24 text-center">
            {emptyIcon && (
              <div className="flex justify-center mb-4 text-muted-foreground/30">
                {emptyIcon}
              </div>
            )}
            <h3 className="text-lg font-bold text-foreground mb-1">
              {emptyTitle}
            </h3>
            <p className="text-sm text-muted-foreground">{emptyDescription}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/20 dark:bg-white/5 data-[state=selected]:bg-muted">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="hover:bg-transparent border-white/10 dark:border-white/5"
                    >
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort()
                        return (
                          <TableHead
                            key={header.id}
                            className="h-11 text-[11px] uppercase tracking-wider font-bold text-muted-foreground"
                          >
                            {header.isPlaceholder ? null : canSort ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="-ml-3 h-8 hover:bg-white/20 dark:hover:bg-white/10 data-[state=open]:bg-accent text-[11px] uppercase tracking-wider font-bold"
                                onClick={() => handleSort(header.column.id)}
                                aria-label={`Sort by ${header.column.columnDef.header}`}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                                {getSortIcon(header.column.id)}
                              </Button>
                            ) : (
                              flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )
                            )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="border-white/10 dark:border-white/5 hover:bg-white/30 dark:hover:bg-white/5 transition-colors group"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="py-3 text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-white/10 dark:divide-white/5">
              {table.getRowModel().rows.map((row) => {
                const cells = row.getVisibleCells()
                const actionCell = cells.find((c) => c.column.id === 'actions')

                // Prioritize Date column
                const dateCell = cells.find(
                  (c) =>
                    c.column.id.toLowerCase().includes('date') ||
                    c.column.columnDef.header
                      ?.toString()
                      .toLowerCase()
                      .includes('date'),
                )

                // Get other main cells (excluding actions and date if found)
                const mainCells = cells
                  .filter(
                    (c) => c.column.id !== 'actions' && c.id !== dateCell?.id,
                  )
                  .slice(0, 3)

                return (
                  <div
                    key={row.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-white/10 dark:hover:bg-white/5 transition-colors active:scale-[0.99]"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {mainCells.map((cell, idx) => (
                        <div
                          key={cell.id}
                          className={
                            idx === 0
                              ? 'font-bold text-base text-foreground'
                              : 'text-sm text-muted-foreground truncate'
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      ))}
                      {dateCell && (
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70 font-medium">
                          {flexRender(
                            dateCell.column.columnDef.cell,
                            dateCell.getContext(),
                          )}
                        </div>
                      )}
                    </div>
                    {actionCell && (
                      <div className="shrink-0">
                        {flexRender(
                          actionCell.column.columnDef.cell,
                          actionCell.getContext(),
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={(newPage) => onPaginationChange(newPage, pageSize)}
          onPageSizeChange={(newSize) => onPaginationChange(1, newSize)}
        />
      )}
    </div>
  )
}
