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

  // Filter out customers with 0 purchases
  const activeCustomers = customers.filter((c) => c.salesCount > 0)

  if (activeCustomers.length === 0) return null

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-4 w-4 text-yellow-600" />
      case 1:
        return <Medal className="h-4 w-4 text-slate-400" />
      case 2:
        return <Award className="h-4 w-4 text-amber-700" />
      default:
        return null
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <div>
            <CardTitle className="text-sm">
              {t('customers:top.title', {
                defaultValue: 'Top Customers',
              })}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('customers:top.desc', {
                defaultValue: 'Most active customers by total spent.',
              })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activeCustomers.slice(0, 5).map((customer, index) => (
            <div
              key={customer.id}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div className="flex items-center gap-3">
                {getRankIcon(index) || (
                  <span className="w-4 text-center text-xs font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                )}
                <div>
                  <p className="font-medium text-sm">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.salesCount}{' '}
                    {customer.salesCount === 1 ? 'purchase' : 'purchases'}
                  </p>
                </div>
              </div>
              <p className="font-semibold text-sm">
                {formatCurrency(customer.totalSpent)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
