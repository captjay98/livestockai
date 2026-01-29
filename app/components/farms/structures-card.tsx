import { Edit, Home, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type {
  StructureStatus,
  StructureType,
} from '~/features/structures/server'
import {
  STRUCTURE_STATUSES,
  STRUCTURE_TYPES,
  createStructureFn,
  deleteStructureFn,
  getStructuresWithCountsFn,
  updateStructureFn,
} from '~/features/structures/server'
import { useFormatArea } from '~/features/settings'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'

interface Structure {
  id: string
  farmId: string
  name: string
  type: string
  capacity: number | null
  areaSqm: string | null
  status: string
  notes: string | null
  createdAt: Date
  batchCount: number
  totalAnimals: number
}

interface StructuresCardProps {
  farmId: string
  initialStructures: Array<Structure>
}

export function StructuresCard({
  farmId,
  initialStructures,
}: StructuresCardProps) {
  const { t } = useTranslation(['farms', 'common'])
  const { label: areaLabel } = useFormatArea()

  const [structures, setStructures] =
    useState<Array<Structure>>(initialStructures)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(
    null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    type: 'house' as StructureType,
    capacity: '',
    areaSqm: '',
    status: 'active' as StructureStatus,
    notes: '',
  })

  const resetForm = () => {
    setForm({
      name: '',
      type: 'house',
      capacity: '',
      areaSqm: '',
      status: 'active',
      notes: '',
    })
    setError('')
  }

  const refreshStructures = async () => {
    const updated = await getStructuresWithCountsFn({ data: { farmId } })
    setStructures(updated)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await createStructureFn({
        data: {
          input: {
            farmId,
            name: form.name,
            type: form.type,
            capacity: form.capacity ? parseInt(form.capacity) : null,
            areaSqm: form.areaSqm ? parseFloat(form.areaSqm) : null,
            status: form.status,
            notes: form.notes || null,
          },
        },
      })
      await refreshStructures()
      setCreateDialogOpen(false)
      resetForm()
      toast.success(t('farms:structures.created'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStructure) return
    setIsSubmitting(true)
    setError('')
    try {
      await updateStructureFn({
        data: {
          id: selectedStructure.id,
          input: {
            name: form.name,
            type: form.type,
            capacity: form.capacity ? parseInt(form.capacity) : null,
            areaSqm: form.areaSqm ? parseFloat(form.areaSqm) : null,
            status: form.status,
            notes: form.notes || null,
          },
        },
      })
      await refreshStructures()
      setEditDialogOpen(false)
      resetForm()
      toast.success(t('farms:structures.updated'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedStructure) return
    setIsSubmitting(true)
    setError('')
    try {
      await deleteStructureFn({ data: { id: selectedStructure.id } })
      await refreshStructures()
      setDeleteDialogOpen(false)
      toast.success(t('farms:structures.deleted'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (structure: Structure) => {
    setSelectedStructure(structure)
    setForm({
      name: structure.name,
      type: structure.type as StructureType,
      capacity: structure.capacity?.toString() || '',
      areaSqm: structure.areaSqm || '',
      status: structure.status as StructureStatus,
      notes: structure.notes || '',
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (structure: Structure) => {
    setSelectedStructure(structure)
    setDeleteDialogOpen(true)
  }

  const StructureForm = ({
    onSubmit,
  }: {
    onSubmit: (e: React.FormEvent) => void
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t('farms:structures.form.name')}</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('farms:structures.form.type')}</Label>
          <Select
            value={form.type}
            onValueChange={(v) =>
              v && setForm((p) => ({ ...p, type: v as StructureType }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STRUCTURE_TYPES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {t(`farms:structures.types.${item.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('farms:structures.form.status')}</Label>
          <Select
            value={form.status}
            onValueChange={(v) =>
              v &&
              setForm((p) => ({
                ...p,
                status: v as StructureStatus,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STRUCTURE_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {t(`farms:structures.statuses.${s.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('farms:structures.form.capacity')}</Label>
          <Input
            type="number"
            min="0"
            value={form.capacity}
            onChange={(e) =>
              setForm((p) => ({ ...p, capacity: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>{t('farms:structures.form.area', { unit: areaLabel })}</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.areaSqm}
            onChange={(e) =>
              setForm((p) => ({ ...p, areaSqm: e.target.value }))
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t('farms:structures.form.notes')}</Label>
        <Input
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        />
      </div>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setCreateDialogOpen(false)
            setEditDialogOpen(false)
          }}
        >
          {t('farms:structures.form.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('farms:structures.form.saving')
            : t('farms:structures.form.save')}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <>
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>{t('farms:structures.title')}</CardTitle>
            <CardDescription>
              {t('farms:structures.description')}
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger
              render={
                <Button size="sm" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('farms:structures.add')}
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('farms:structures.form.title')}</DialogTitle>
              </DialogHeader>
              <StructureForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {structures.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              {t('farms:structures.noStructures')}
            </div>
          ) : (
            <div className="space-y-3">
              {structures.map((structure) => (
                <div
                  key={structure.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted">
                      <Home className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{structure.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {t(`farms:structures.types.${structure.type}`)}
                        {structure.capacity &&
                          ` • ${structure.capacity} capacity`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        structure.status === 'active'
                          ? 'default'
                          : structure.status === 'empty'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {t(`farms:structures.statuses.${structure.status}`)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(structure)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => openDeleteDialog(structure)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('farms:structures.form.editTitle')}</DialogTitle>
          </DialogHeader>
          <StructureForm onSubmit={handleEdit} />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('farms:structures.form.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('farms:structures.form.deleteDesc', {
                name: selectedStructure?.name,
              })}
              {selectedStructure && selectedStructure.batchCount > 0 && (
                <span className="block mt-2 text-destructive">
                  {t('farms:structures.form.deleteWarning', {
                    count: selectedStructure.batchCount,
                  })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t('farms:structures.form.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('farms:structures.form.deleting')
                : t('farms:structures.form.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
