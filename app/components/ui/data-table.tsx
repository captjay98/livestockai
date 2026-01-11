import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
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
      <div className="flex flex-col sm:flex-row gap-4">
        {onSearchChange && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        )}
        {filters && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {filters}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center">
            {emptyIcon && (
              <div className="flex justify-center mb-4 text-muted-foreground">
                {emptyIcon}
              </div>
            )}
            <h3 className="text-lg font-semibold mb-2">{emptyTitle}</h3>
            <p className="text-muted-foreground">{emptyDescription}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort()
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder ? null : canSort ? (
                              <Button
                                variant="ghost"
                                className="-ml-4 h-8 hover:bg-transparent"
                                onClick={() => handleSort(header.column.id)}
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
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
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
            <div className="md:hidden divide-y">
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
                    className="p-3 flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      {mainCells.map((cell, idx) => (
                        <div
                          key={cell.id}
                          className={
                            idx === 0
                              ? 'font-medium'
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
                        <div className="text-xs text-muted-foreground mt-1">
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
