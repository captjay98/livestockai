import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, Pill, Plus, Trash2 } from 'lucide-react'
import type { MedicationItem, MedicationUnit } from '~/features/inventory'
import { MEDICATION_UNITS } from '~/features/inventory'
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

interface MedicationInventoryTableProps {
    items: Array<MedicationItem>
    isLoading: boolean
    isSubmitting: boolean
    onCreateMedication: (data: {
        medicationName: string
        quantity: number
        unit: MedicationUnit
        expiryDate: Date | null
        minThreshold: number
    }) => Promise<void>
    onUpdateMedication: (
        id: string,
        data: {
            quantity: number
            expiryDate: Date | null
            minThreshold: number
        },
    ) => Promise<void>
    onDeleteMedication: (id: string) => Promise<void>
}

export function MedicationInventoryTable({
    items,
    isLoading,
    isSubmitting,
    onCreateMedication,
    onUpdateMedication,
    onDeleteMedication,
}: MedicationInventoryTableProps) {
    const { t } = useTranslation(['inventory', 'common'])
    const [error, setError] = useState('')
    const [medDialogOpen, setMedDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedMed, setSelectedMed] = useState<MedicationItem | null>(null)
    const [medForm, setMedForm] = useState({
        medicationName: '',
        quantity: '',
        unit: 'vials' as MedicationUnit,
        expiryDate: '',
        minThreshold: '5',
    })

    const resetForm = () => {
        setMedForm({
            medicationName: '',
            quantity: '',
            unit: 'vial',
            expiryDate: '',
            minThreshold: '5',
        })
        setError('')
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            await onCreateMedication({
                medicationName: medForm.medicationName,
                quantity: parseInt(medForm.quantity),
                unit: medForm.unit,
                expiryDate: medForm.expiryDate
                    ? new Date(medForm.expiryDate)
                    : null,
                minThreshold: parseInt(medForm.minThreshold),
            })
            setMedDialogOpen(false)
            resetForm()
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : t('medication.error.create'),
            )
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedMed) return
        setError('')
        try {
            await onUpdateMedication(selectedMed.id, {
                quantity: parseInt(medForm.quantity),
                expiryDate: medForm.expiryDate
                    ? new Date(medForm.expiryDate)
                    : null,
                minThreshold: parseInt(medForm.minThreshold),
            })
            setEditDialogOpen(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update')
        }
    }

    const handleDelete = async () => {
        if (!selectedMed) return
        setError('')
        try {
            await onDeleteMedication(selectedMed.id)
            setDeleteDialogOpen(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete')
        }
    }

    const isExpired = (date: Date | string | null) => {
        if (!date) return false
        return new Date(date) < new Date()
    }

    const isExpiringSoon = (date: Date | string | null) => {
        if (!date) return false
        const d = new Date(date)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        return d <= thirtyDaysFromNow && !isExpired(date)
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{t('medication.title')}</CardTitle>
                    <CardDescription>
                        {t('medication.description')}
                    </CardDescription>
                </div>
                <Dialog open={medDialogOpen} onOpenChange={setMedDialogOpen}>
                    <DialogTrigger>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('medication.add')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {t('dialog.addMedicationTitle')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('dialog.addMedicationDesc')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('medication.name')}</Label>
                                <Input
                                    value={medForm.medicationName}
                                    onChange={(e) =>
                                        setMedForm((p) => ({
                                            ...p,
                                            medicationName: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('medication.quantity')}</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={medForm.quantity}
                                        onChange={(e) =>
                                            setMedForm((p) => ({
                                                ...p,
                                                quantity: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('medication.unit')}</Label>
                                    <Select
                                        value={medForm.unit}
                                        onValueChange={(v) =>
                                            v &&
                                            setMedForm((p) => ({
                                                ...p,
                                                unit: v,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MEDICATION_UNITS.map((unit) => (
                                                <SelectItem
                                                    key={unit.value}
                                                    value={unit.value}
                                                >
                                                    {unit.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('medication.expiry')}</Label>
                                    <Input
                                        type="date"
                                        value={medForm.expiryDate}
                                        onChange={(e) =>
                                            setMedForm((p) => ({
                                                ...p,
                                                expiryDate: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('medication.threshold')}</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={medForm.minThreshold}
                                        onChange={(e) =>
                                            setMedForm((p) => ({
                                                ...p,
                                                minThreshold: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </div>
                            </div>
                            {error && (
                                <div className="text-sm text-destructive">
                                    {error}
                                </div>
                            )}
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setMedDialogOpen(false)}
                                >
                                    {t('common:cancel')}
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting
                                        ? t('dialog.adding')
                                        : t('medication.add')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="text-center py-8">
                        {t('common:loading')}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-8">
                        <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            {t('medication.empty')}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => {
                            const lowStock = item.quantity <= item.minThreshold
                            const expired = isExpired(item.expiryDate)
                            const expiring = isExpiringSoon(item.expiryDate)

                            return (
                                <Card
                                    key={item.id}
                                    className={`${
                                        expired
                                            ? 'border-destructive/50'
                                            : expiring
                                              ? 'border-warning/50'
                                              : lowStock
                                                ? 'border-warning/50'
                                                : ''
                                    }`}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">
                                                {item.medicationName}
                                            </CardTitle>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedMed(item)
                                                        setMedForm({
                                                            medicationName:
                                                                item.medicationName,
                                                            quantity:
                                                                item.quantity.toString(),
                                                            unit: item.unit as
                                                                | 'vial'
                                                                | 'bottle'
                                                                | 'sachet'
                                                                | 'ml'
                                                                | 'g'
                                                                | 'tablet'
                                                                | 'kg'
                                                                | 'liter',
                                                            expiryDate:
                                                                item.expiryDate
                                                                    ? new Date(
                                                                          item.expiryDate,
                                                                      )
                                                                          .toISOString()
                                                                          .split(
                                                                              'T',
                                                                          )[0]
                                                                    : '',
                                                            minThreshold:
                                                                item.minThreshold.toString(),
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
                                                        setSelectedMed(item)
                                                        setDeleteDialogOpen(
                                                            true,
                                                        )
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
                                                    {t('medication.stock')}:
                                                </span>
                                                <span
                                                    className={`font-bold ${lowStock ? 'text-warning' : ''}`}
                                                >
                                                    {item.quantity} {item.unit}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    {t('medication.threshold')}:
                                                </span>
                                                <span>
                                                    {item.minThreshold}{' '}
                                                    {item.unit}
                                                </span>
                                            </div>
                                            {item.expiryDate && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        {t('medication.expiry')}
                                                        :
                                                    </span>
                                                    <span
                                                        className={`${
                                                            expired
                                                                ? 'text-destructive font-bold'
                                                                : expiring
                                                                  ? 'text-warning font-bold'
                                                                  : ''
                                                        }`}
                                                    >
                                                        {new Date(
                                                            item.expiryDate,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
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
                        <DialogTitle>
                            {t('dialog.editMedicationTitle')}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('medication.quantity')}</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={medForm.quantity}
                                    onChange={(e) =>
                                        setMedForm((p) => ({
                                            ...p,
                                            quantity: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('medication.threshold')}</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={medForm.minThreshold}
                                    onChange={(e) =>
                                        setMedForm((p) => ({
                                            ...p,
                                            minThreshold: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('medication.expiry')}</Label>
                            <Input
                                type="date"
                                value={medForm.expiryDate}
                                onChange={(e) =>
                                    setMedForm((p) => ({
                                        ...p,
                                        expiryDate: e.target.value,
                                    }))
                                }
                            />
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
                                {isSubmitting
                                    ? t('common:saving')
                                    : t('common:save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('common:deleteConfirm')}</DialogTitle>
                        <DialogDescription>
                            {t('medication.deleteWarning')}
                        </DialogDescription>
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
