import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight, Clock, Pill } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { differenceInDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

interface MedicationInventoryItem {
  id: string
  medicationName: string
  quantity: number
  unit: string
  minThreshold: number
  expiryDate?: Date | string | null
}

interface MedicationInventorySummaryProps {
  inventory: Array<MedicationInventoryItem>
}

export function MedicationInventorySummary({
  inventory,
}: MedicationInventorySummaryProps) {
  const { t } = useTranslation(['vaccinations', 'common'])

  if (inventory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            {t('vaccinations:inventory.title', {
              defaultValue: 'Current Medication Inventory',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {t('vaccinations:inventory.empty', {
                defaultValue: 'No medication inventory found',
              })}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/inventory" search={{ tab: 'medication' }}>
                {t('vaccinations:inventory.manage', {
                  defaultValue: 'Manage Inventory',
                })}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const lowStockItems = inventory.filter(
    (item) => item.quantity <= item.minThreshold,
  )

  const expiringItems = inventory.filter((item) => {
    if (!item.expiryDate) return false
    const daysUntilExpiry = differenceInDays(
      new Date(item.expiryDate),
      new Date(),
    )
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30
  })

  const expiredItems = inventory.filter((item) => {
    if (!item.expiryDate) return false
    return new Date(item.expiryDate) < new Date()
  })

  const alertCount =
    lowStockItems.length + expiringItems.length + expiredItems.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          {t('vaccinations:inventory.title', {
            defaultValue: 'Current Medication Inventory',
          })}
          {alertCount > 0 && (
            <Badge variant="destructive" className="ml-auto">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {alertCount}{' '}
              {t('vaccinations:inventory.alerts', { defaultValue: 'Alerts' })}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {inventory.map((item) => {
            const isLowStock = item.quantity <= item.minThreshold
            const daysUntilExpiry = item.expiryDate
              ? differenceInDays(new Date(item.expiryDate), new Date())
              : null
            const isExpiring =
              daysUntilExpiry !== null &&
              daysUntilExpiry > 0 &&
              daysUntilExpiry <= 30
            const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isExpired
                        ? 'bg-destructive'
                        : isLowStock || isExpiring
                          ? 'bg-warning'
                          : 'bg-success'
                    }`}
                  />
                  <div>
                    <p className="font-medium">{item.medicationName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {t('vaccinations:inventory.threshold', {
                          defaultValue: 'Min',
                        })}
                        : {item.minThreshold} {item.unit}
                      </span>
                      {isExpiring && (
                        <Badge
                          variant="outline"
                          className="text-warning border-warning"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {daysUntilExpiry}d
                        </Badge>
                      )}
                      {isExpired && (
                        <Badge variant="destructive">
                          {t('vaccinations:inventory.expired', {
                            defaultValue: 'Expired',
                          })}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${isLowStock || isExpired ? 'text-destructive' : ''}`}
                  >
                    {item.quantity} {item.unit}
                  </p>
                  {isLowStock && (
                    <p className="text-xs text-destructive">
                      {t('vaccinations:inventory.lowStock', {
                        defaultValue: 'Low Stock',
                      })}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <Button asChild variant="outline" className="w-full mt-4">
          <Link to="/inventory" search={{ tab: 'medication' }}>
            {t('vaccinations:inventory.manage', {
              defaultValue: 'Manage Inventory',
            })}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
