import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight, Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { useFormatWeight } from '~/features/settings'

interface FeedInventoryItem {
  id: string
  feedType: string
  quantityKg: string
  minThresholdKg: string
}

interface FeedInventorySummaryProps {
  inventory: Array<FeedInventoryItem>
}

export function FeedInventorySummary({ inventory }: FeedInventorySummaryProps) {
  const { t } = useTranslation(['feed', 'common'])
  const { format: formatWeight } = useFormatWeight()

  if (inventory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('feed:inventory.title', {
              defaultValue: 'Current Feed Inventory',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {t('feed:inventory.empty', {
                defaultValue: 'No feed inventory found',
              })}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/inventory">
                {t('feed:inventory.manage', {
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
    (item) => parseFloat(item.quantityKg) <= parseFloat(item.minThresholdKg),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {t('feed:inventory.title', {
            defaultValue: 'Current Feed Inventory',
          })}
          {lowStockItems.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {lowStockItems.length}{' '}
              {t('feed:inventory.lowStock', { defaultValue: 'Low Stock' })}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[200px] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {inventory.map((item) => {
              const isLowStock =
                parseFloat(item.quantityKg) <= parseFloat(item.minThresholdKg)
              const stockPercentage =
                (parseFloat(item.quantityKg) / parseFloat(item.minThresholdKg)) *
                100

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`h-2 w-2 rounded-full shrink-0 ${isLowStock ? 'bg-destructive' : 'bg-success'}`}
                    />
                    <p className="font-medium capitalize truncate text-sm">
                      {item.feedType.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p
                      className={`font-semibold text-sm ${isLowStock ? 'text-destructive' : ''}`}
                    >
                      {formatWeight(parseFloat(item.quantityKg))}
                    </p>
                    {isLowStock && (
                      <p className="text-xs text-destructive">
                        {stockPercentage.toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="w-full mt-3">
          <Link to="/inventory" search={{ tab: 'feed' }}>
            {t('feed:inventory.manage', { defaultValue: 'Manage Inventory' })}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
