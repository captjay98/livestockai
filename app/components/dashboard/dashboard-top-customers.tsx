import { UserCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useFormatCurrency } from '~/features/settings'
import { cn } from '~/lib/utils'

export interface TopCustomer {
    id: string
    name: string
    totalSpent: number
}

interface DashboardTopCustomersProps {
    customers: Array<TopCustomer>
}

export function DashboardTopCustomers({
    customers,
}: DashboardTopCustomersProps) {
    const { t } = useTranslation(['dashboard'])
    const { format: formatCurrency } = useFormatCurrency()

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    {t('dashboard.topCustomers', {
                        defaultValue: 'Top Customers',
                    })}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {customers.slice(0, 5).map((customer, i) => (
                    <div key={customer.id} className="flex items-center gap-3">
                        <div
                            className={cn(
                                'h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                                i === 0
                                    ? 'bg-amber-100 text-amber-700'
                                    : i === 1
                                      ? 'bg-slate-200 text-slate-600'
                                      : i === 2
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-muted',
                            )}
                        >
                            {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                                {customer.name}
                            </p>
                        </div>
                        <span className="text-sm text-muted-foreground shrink-0">
                            {formatCurrency(customer.totalSpent)}
                        </span>
                    </div>
                ))}
                {customers.length === 0 && (
                    <p className="text-center py-4 text-sm text-muted-foreground">
                        {t('dashboard.noCustomerData', {
                            defaultValue: 'No customer data yet',
                        })}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
