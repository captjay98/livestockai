import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, Package, Plus, Trash2 } from 'lucide-react'
import type { FeedInventoryItem, FeedType } from '~/features/inventory'
import { FEED_TYPES } from '~/features/inventory'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface FeedInventoryTableProps {
  items: Array<FeedInventoryItem>
  isLoading: boolean
  isSubmitting: boolean
  formatWeight: (val: number) => string
  onCreateFeed: (data: {
    feedType: FeedType
    quantityKg: number
    minThresholdKg: number
  }) => Promise<void>
  onUpdateFeed: (
    id: string,
    data: { quantityKg: number; minThresholdKg: number },
  ) => Promise<void>
  onDeleteFeed: (id: string) => Promise<void>
}

export function FeedInventoryTable({
  items,
  isLoading,
  isSubmitting,
  formatWeight,
  onCreateFeed,
  onUpdateFeed,
  onDeleteFeed,
}: FeedInventoryTableProps) {
  const { t } = useTranslation(['inventory', 'common'])
  const [error, setError] = useState('')
  const [feedDialogOpen, setFeedDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFeed, setSelectedFeed] = useState<FeedInventoryItem | null>(
    null,
  )
  const [feedForm, setFeedForm] = useState({
    feedType: 'starter' as FeedType,
    quantityKg: '',
    minThresholdKg: '10',
  })

  const resetForm = () => {
    setFeedForm({
      feedType: 'starter',
      quantityKg: '',
      minThresholdKg: '10',
    })
    setError('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await onCreateFeed({
        feedType: feedForm.feedType,
        quantityKg: parseFloat(feedForm.quantityKg),
        minThresholdKg: parseFloat(feedForm.minThresholdKg),
      })
      setFeedDialogOpen(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('feed.error.create'))
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFeed) return
    setError('')
    try {
      await onUpdateFeed(selectedFeed.id, {
        quantityKg: parseFloat(feedForm.quantityKg),
        minThresholdKg: parseFloat(feedForm.minThresholdKg),
      })
      setEditDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const handleDelete = async () => {
    if (!selectedFeed) return
    setError('')
    try {
      await onDeleteFeed(selectedFeed.id)
      setDeleteDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('feed.title')}</CardTitle>
          <CardDescription>{t('feed.description')}</CardDescription>
        </div>
        <Dialog open={feedDialogOpen} onOpenChange={setFeedDialogOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('feed.add')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dialog.addFeedTitle')}</DialogTitle>
              <DialogDescription>{t('dialog.addFeedDesc')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('feed.type')}</Label>
                <Select
                  value={feedForm.feedType}
                  onValueChange={(v) =>
                    v &&
                    setFeedForm((p) => ({
                      ...p,
                      feedType: v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEED_TYPES.map((typeItem) => (
                      <SelectItem key={typeItem.value} value={typeItem.value}>
                        {typeItem.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('feed.quantity')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={feedForm.quantityKg}
                    onChange={(e) =>
                      setFeedForm((p) => ({
                        ...p,
                        quantityKg: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('feed.threshold')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={feedForm.minThresholdKg}
                    onChange={(e) =>
                      setFeedForm((p) => ({
                        ...p,
                        minThresholdKg: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFeedDialogOpen(false)}
                >
                  {t('common:cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('dialog.adding') : t('feed.add')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">{t('common:loading')}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('feed.empty')}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const qty = parseFloat(item.quantityKg)
              const threshold = parseFloat(item.minThresholdKg)
              const lowStock = qty <= threshold
              return (
                <Card
                  key={item.id}
                  className={lowStock ? 'border-warning/50' : ''}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg capitalize">
                        {item.feedType.replace('_', ' ')}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFeed(item)
                            setFeedForm({
                              feedType: item.feedType as FeedType,
                              quantityKg: item.quantityKg,
                              minThresholdKg: item.minThresholdKg,
                            })
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            setSelectedFeed(item)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('feed.stock')}:
                        </span>
                        <span
                          className={`font-bold ${lowStock ? 'text-warning' : ''}`}
                        >
                          {formatWeight(qty)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('feed.threshold')}:
                        </span>
                        <span>{formatWeight(threshold)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialog.editFeedTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('feed.quantity')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={feedForm.quantityKg}
                  onChange={(e) =>
                    setFeedForm((p) => ({
                      ...p,
                      quantityKg: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('feed.threshold')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={feedForm.minThresholdKg}
                  onChange={(e) =>
                    setFeedForm((p) => ({
                      ...p,
                      minThresholdKg: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                {t('common:cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common:saving') : t('common:save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common:deleteConfirm')}</DialogTitle>
            <DialogDescription>{t('feed.deleteWarning')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t('common:cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {t('common:delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
