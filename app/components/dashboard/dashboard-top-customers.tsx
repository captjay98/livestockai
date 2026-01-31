import { Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useFormatCurrency } from '~/features/settings'
import { cn } from '~/lib/utils'

export interface TopCustomer {
  id: string
  name: string
  totalSpent: number
  salesCount?: number // Optional purchase count
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
    <Card className="bg-white/40 dark:bg-black/40 backdrop-blur-md border-white/20 dark:border-white/10 shadow-lg overflow-hidden">
      <CardHeader className="pb-3 px-4">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {t('dashboard.topCustomers', {
              defaultValue: 'Top Customers',
            })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 overflow-hidden">
        <div className="space-y-1">
          {customers.slice(0, 5).map((customer, i) => (
            <div
              key={customer.id}
              className={cn(
                'flex items-center gap-3 py-2 px-2.5 rounded-lg transition-colors',
                i === 0 && 'bg-amber-500/10',
                i === 1 && 'bg-slate-500/10',
                i === 2 && 'bg-orange-500/10',
              )}
            >
              {/* Rank Badge */}
              <div
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                  i === 0 && 'bg-amber-500 text-white',
                  i === 1 && 'bg-slate-500 text-white',
                  i === 2 && 'bg-orange-500 text-white',
                  i > 2 && 'bg-muted text-muted-foreground',
                )}
              >
                {i + 1}
              </div>

              {/* Customer Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {customer.name}
                </p>
                {customer.salesCount !== undefined && (
                  <p className="text-[11px] text-muted-foreground">
                    {customer.salesCount}{' '}
                    {customer.salesCount === 1 ? 'purchase' : 'purchases'}
                  </p>
                )}
              </div>

              {/* Amount */}
              <p className="text-sm font-bold text-foreground shrink-0">
                {formatCurrency(customer.totalSpent)}
              </p>
            </div>
          ))}
        </div>

        {customers.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center">
              <Trophy className="h-4 w-4 opacity-50" />
            </div>
            <p>
              {t('dashboard.noCustomerData', {
                defaultValue: 'No customer data yet',
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
