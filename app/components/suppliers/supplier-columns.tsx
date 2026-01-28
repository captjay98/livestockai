import { Link } from '@tanstack/react-router'
import { Eye, Mail, MapPin, Phone } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import type { SupplierRecord } from '~/features/suppliers/types'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

export interface GetSupplierColumnsProps {
    t: TFunction
    formatCurrency: (amount: number) => string
}

export function getSupplierColumns({
    t,
    formatCurrency,
}: GetSupplierColumnsProps): Array<ColumnDef<SupplierRecord>> {
    return [
        {
            accessorKey: 'name',
            header: t('suppliers:table.name'),
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.name}</span>
                    <span className="text-xs text-muted-foreground md:hidden">
                        {row.original.phone}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'phone',
            header: t('suppliers:table.contact'),
            cell: ({ row }) => (
                <div className="flex flex-col text-sm">
                    <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {row.original.phone}
                    </div>
                    {row.original.email && (
                        <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                            <Mail className="h-3 w-3" />
                            {row.original.email}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'location',
            header: t('suppliers:table.location'),
            cell: ({ row }) =>
                row.original.location ? (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {row.original.location}
                    </div>
                ) : (
                    '-'
                ),
        },
        {
            accessorKey: 'supplierType',
            header: t('suppliers:table.type'),
            cell: ({ row }) =>
                row.original.supplierType ? (
                    <Badge variant="outline" className="capitalize text-xs">
                        {t(`suppliers:types.${row.original.supplierType}`)}
                    </Badge>
                ) : (
                    '-'
                ),
        },
        {
            accessorKey: 'products',
            header: t('suppliers:table.products'),
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1">
                    {row.original.products.slice(0, 3).map((product, i) => (
                        <Badge
                            key={i}
                            variant="secondary"
                            className="text-[10px] px-1 py-0 h-5"
                        >
                            {product}
                        </Badge>
                    ))}
                    {row.original.products.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                            +{row.original.products.length - 3}
                        </span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'totalSpent',
            header: t('suppliers:table.totalSpent'),
            cell: ({ row }) => (
                <span className="font-medium">
                    {formatCurrency(row.original.totalSpent || 0)}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" asChild>
                        <Link
                            to="/suppliers/$supplierId"
                            params={{ supplierId: row.original.id }}
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            {t('suppliers:table.view')}
                        </Link>
                    </Button>
                </div>
            ),
        },
    ]
}
