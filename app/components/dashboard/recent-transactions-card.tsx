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

  // Glassmorphic card style
  const cardClassName =
    'bg-white/40 dark:bg-black/40 backdrop-blur-md border-white/20 dark:border-white/10 shadow-lg hover:bg-white/50 dark:hover:bg-black/50 transition-all rounded-3xl overflow-hidden'

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {t('dashboard.recentTransactions', {
            defaultValue: 'Recent Transactions',
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {transactions.slice(0, 5).map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/20 dark:hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={cn(
                  'h-9 w-9 rounded-full flex items-center justify-center shrink-0 backdrop-blur-sm',
                  tx.type === 'sale'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/20 text-red-600 dark:text-red-400',
                )}
              >
                {tx.type === 'sale' ? (
                  <span className="font-bold text-xs">{currencySymbol}</span>
                ) : (
                  <Receipt className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                  {tx.description}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDate(tx.date)}
                </p>
              </div>
            </div>
            <span
              className={cn(
                'font-bold text-sm shrink-0 ml-2',
                tx.type === 'sale'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400',
              )}
            >
              {tx.type === 'sale' ? '+' : '-'}
              {formatCurrency(tx.amount)}
            </span>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center">
              <Activity className="h-5 w-5 opacity-50" />
            </div>
            <p>
              {t('dashboard.noTransactions', {
                defaultValue: 'No transactions yet',
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
