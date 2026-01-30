import { useState } from 'react'
import { Edit, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { SuppliesInventoryDialog } from './supplies-inventory-dialog'
import { SuppliesStockDialog } from './supplies-stock-dialog'
import type { SupplyItem } from '~/features/inventory/supplies-repository'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'

interface SuppliesInventoryTableProps {
  items: Array<SupplyItem>
  isLoading: boolean
  isSubmitting: boolean
  onCreateSupply: (data: any) => void
  onUpdateSupply: (data: { id: string; input: any }) => void
  onDeleteSupply: (id: string) => void
  onAddStock: (data: { supplyId: string; quantity: number }) => void
  onReduceStock: (data: { supplyId: string; quantity: number }) => void
}

export function SuppliesInventoryTable({
  items,
  isSubmitting,
  onCreateSupply,
  onUpdateSupply,
  onDeleteSupply,
  onAddStock,
  onReduceStock,
}: SuppliesInventoryTableProps) {
  const { t } = useTranslation('inventory')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [stockMode, setStockMode] = useState<'add' | 'reduce'>('add')
  const [selectedSupply, setSelectedSupply] = useState<SupplyItem | null>(null)

  const handleEdit = (supply: SupplyItem) => {
    setSelectedSupply(supply)
    setEditDialogOpen(true)
  }

  const handleDelete = (supply: SupplyItem) => {
    setSelectedSupply(supply)
    setDeleteDialogOpen(true)
  }

  const handleAddStock = (supply: SupplyItem) => {
    setSelectedSupply(supply)
    setStockMode('add')
    setStockDialogOpen(true)
  }

  const handleReduceStock = (supply: SupplyItem) => {
    setSelectedSupply(supply)
    setStockMode('reduce')
    setStockDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedSupply) {
      onDeleteSupply(selectedSupply.id)
      setDeleteDialogOpen(false)
      setSelectedSupply(null)
    }
  }

  const isLowStock = (item: SupplyItem) => {
    const qty = parseFloat(item.quantityKg)
    const threshold = parseFloat(item.minThresholdKg)
    return qty <= threshold
  }

  const isExpiringSoon = (item: SupplyItem) => {
    if (!item.expiryDate) return false
    const now = new Date()
    const expiry = new Date(item.expiryDate)
    const daysUntil = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    )
    return daysUntil > 0 && daysUntil <= 30
  }

  const isExpired = (item: SupplyItem) => {
    if (!item.expiryDate) return false
    return new Date(item.expiryDate) < new Date()
  }

  const getCategoryLabel = (category: string) => {
    return t(`supplies.categories.${category}`, { defaultValue: category })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t('supplies.title')}</h3>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('supplies.add')}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('supplies.itemName')}</TableHead>
              <TableHead>{t('supplies.category')}</TableHead>
              <TableHead>{t('supplies.quantity')}</TableHead>
              <TableHead>{t('supplies.unit')}</TableHead>
              <TableHead>{t('supplies.minThreshold')}</TableHead>
              <TableHead>{t('supplies.status')}</TableHead>
              <TableHead>{t('supplies.expiryDate')}</TableHead>
              <TableHead className="text-right">
                {t('supplies.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  {t('supplies.empty')}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>{getCategoryLabel(item.category)}</TableCell>
                  <TableCell>
                    {parseFloat(item.quantityKg).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {t(`supplies.units.${item.unit}`, {
                      defaultValue: item.unit,
                    })}
                  </TableCell>
                  <TableCell>
                    {parseFloat(item.minThresholdKg).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {isLowStock(item) && (
                        <Badge variant="destructive">
                          {t('supplies.lowStock')}
                        </Badge>
                      )}
                      {isExpired(item) && (
                        <Badge variant="destructive">
                          {t('supplies.expired')}
                        </Badge>
                      )}
                      {!isExpired(item) && isExpiringSoon(item) && (
                        <Badge variant="warning">
                          {t('supplies.expiringSoon')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.expiryDate
                      ? format(new Date(item.expiryDate), 'MMM d, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAddStock(item)}
                        title={t('supplies.addStock')}
                      >
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReduceStock(item)}
                        title={t('supplies.reduceStock')}
                      >
                        <TrendingDown className="h-4 w-4 text-orange-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SuppliesInventoryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={onCreateSupply}
        isSubmitting={isSubmitting}
      />

      {selectedSupply && (
        <>
          <SuppliesInventoryDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSubmit={(data) => {
              onUpdateSupply({ id: selectedSupply.id, input: data })
              setEditDialogOpen(false)
            }}
            isSubmitting={isSubmitting}
            initialData={selectedSupply}
          />

          <SuppliesStockDialog
            open={stockDialogOpen}
            onOpenChange={setStockDialogOpen}
            supply={selectedSupply}
            mode={stockMode}
            onSubmit={(quantity) => {
              if (stockMode === 'add') {
                onAddStock({ supplyId: selectedSupply.id, quantity })
              } else {
                onReduceStock({ supplyId: selectedSupply.id, quantity })
              }
              setStockDialogOpen(false)
            }}
            isSubmitting={isSubmitting}
          />

          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('supplies.dialog.deleteTitle')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('supplies.dialog.deleteDesc', {
                    name: selectedSupply.itemName,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm}>
                  {t('common:delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
