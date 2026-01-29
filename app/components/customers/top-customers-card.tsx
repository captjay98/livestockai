import { TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '~/components/ui/badge'
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

  if (customers.length === 0) return null

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('customers:top.title', {
            defaultValue: 'Top Customers',
          })}
        </CardTitle>
        <CardDescription>
          {t('customers:top.desc', {
            defaultValue: 'Your most valuable customers by total spend',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {customers.map((customer, index) => (
            <div
              key={customer.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card"
              style={{
                borderColor: index === 0 ? '#fbbf24' : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={index === 0 ? 'default' : 'outline'}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${index === 0 ? 'bg-yellow-500 text-white hover:bg-yellow-600' : ''}`}
                >
                  {index + 1}
                </Badge>
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.salesCount}{' '}
                    {t('customers:top.purchases', {
                      defaultValue: 'purchases',
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatCurrency(customer.totalSpent)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('customers:top.spent', {
                    defaultValue: 'spent',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
