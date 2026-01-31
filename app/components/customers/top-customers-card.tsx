import { Award, Medal, TrendingUp, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { useFormatCurrency } from '~/features/settings'
import { ScrollArea } from '~/components/ui/scroll-area'

export interface TopCustomer {
  id: string
  name: string
  phone: string
  location: string | null
  salesCount: number
  totalSpent: number
}

interface TopCustomersCardProps {
  customers: Array<TopCustomer>
}

export function TopCustomersCard({ customers }: TopCustomersCardProps) {
  const { t } = useTranslation(['customers', 'common'])
  const { format: formatCurrency } = useFormatCurrency()

  if (customers.length === 0) return null

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-3.5 w-3.5 text-yellow-600" />
      case 1:
        return <Medal className="h-3.5 w-3.5 text-slate-400" />
      case 2:
        return <Award className="h-3.5 w-3.5 text-amber-700" />
      default:
        return (
          <span className="font-bold text-[10px] text-muted-foreground">
            {index + 1}
          </span>
        )
    }
  }

  return (
    <Card className="mb-6 bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-xl overflow-hidden relative">
      <CardHeader className="py-4 px-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">
              {t('customers:top.title', {
                defaultValue: 'Top Customers',
              })}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('customers:top.desc', {
                defaultValue: 'By total spend',
              })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 px-2">
        <ScrollArea className="h-full pr-3 pl-3 pb-3">
          <div className="space-y-1.5">
            {customers.map((customer, index) => (
              <div
                key={customer.id}
                className={`flex items-center justify-between p-2 rounded-lg transition-all border ${
                  index === 0
                    ? 'bg-yellow-500/5 border-yellow-500/10'
                    : index === 1
                      ? 'bg-slate-400/5 border-slate-400/10'
                      : index === 2
                        ? 'bg-amber-700/5 border-amber-700/10'
                        : 'bg-transparent hover:bg-white/40 dark:hover:bg-white/5 border-transparent hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      index === 0
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : index === 1
                          ? 'bg-slate-100 dark:bg-slate-800'
                          : index === 2
                            ? 'bg-amber-100 dark:bg-amber-900/30'
                            : 'bg-muted'
                    }`}
                  >
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-none mb-1 text-foreground">
                      {customer.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {customer.salesCount}{' '}
                        {t('customers:top.purchases', {
                          defaultValue: 'orders',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm tracking-tight text-foreground">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
