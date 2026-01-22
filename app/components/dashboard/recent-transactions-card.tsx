import { Activity, Receipt } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useFormatCurrency, useFormatDate } from '~/features/settings'
import { cn } from '~/lib/utils'

export interface Transaction {
  id: string
  type: 'sale' | 'expense'
  description: string
  amount: number
  date: Date
}

interface RecentTransactionsCardProps {
  transactions: Array<Transaction>
}

export function RecentTransactionsCard({
  transactions,
}: RecentTransactionsCardProps) {
  const { t } = useTranslation(['dashboard'])
  const { format: formatCurrency, symbol: currencySymbol } = useFormatCurrency()
  const { format: formatDate } = useFormatDate()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {t('dashboard.recentTransactions', {
            defaultValue: 'Recent Transactions',
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {transactions.slice(0, 5).map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                  tx.type === 'sale'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-red-100 text-red-600',
                )}
              >
                {tx.type === 'sale' ? (
                  <span className="font-bold text-xs">{currencySymbol}</span>
                ) : (
                  <Receipt className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{tx.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(tx.date)}
                </p>
              </div>
            </div>
            <span
              className={cn(
                'font-bold text-sm shrink-0 ml-2',
                tx.type === 'sale' ? 'text-emerald-600' : 'text-red-600',
              )}
            >
              {tx.type === 'sale' ? '+' : '-'}
              {formatCurrency(tx.amount)}
            </span>
          </div>
        ))}
        {transactions.length === 0 && (
          <p className="text-center py-4 text-sm text-muted-foreground">
            {t('dashboard.noTransactions', {
              defaultValue: 'No transactions yet',
            })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
