import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'

interface Batch {
    id: string
    species: string
    livestockType: string
    currentQuantity: number
    status: string
}

interface MortalityFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: any) => Promise<void>
    batches: Array<Batch>
    initialData?: any
    isSubmitting: boolean
    title: string
}

export const MORTALITY_CAUSES = (t: any) => [
    {
        value: 'disease',
        label: t('mortality:causes.disease', { defaultValue: 'Disease' }),
    },
    {
        value: 'predator',
        label: t('mortality:causes.predator', {
            defaultValue: 'Predator Attack',
        }),
    },
    {
        value: 'weather',
        label: t('mortality:causes.weather', {
            defaultValue: 'Weather/Environment',
        }),
    },
    {
        value: 'unknown',
        label: t('mortality:causes.unknown', { defaultValue: 'Unknown' }),
    },
    {
        value: 'other',
        label: t('mortality:causes.other', { defaultValue: 'Other' }),
    },
]

export function MortalityFormDialog({
    open,
    onOpenChange,
    onSubmit,
    batches,
    initialData,
    isSubmitting,
    title,
}: MortalityFormDialogProps) {
    const { t } = useTranslation(['mortality', 'common', 'batches'])
    const [formData, setFormData] = useState({
        batchId: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        cause: 'unknown',
        notes: '',
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                batchId: initialData.batchId || '',
                quantity: initialData.quantity?.toString() || '',
                date: initialData.date
                    ? new Date(initialData.date).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                cause: initialData.cause || 'unknown',
                notes: initialData.notes || '',
            })
        } else {
            setFormData({
                batchId: '',
                quantity: '',
                date: new Date().toISOString().split('T')[0],
                cause: 'unknown',
                notes: '',
            })
        }
    }, [initialData, open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!initialData && (
                        <div className="space-y-2">
                            <Label htmlFor="batch">
                                {t('batches:batch', { defaultValue: 'Batch' })}
                            </Label>
                            <Select
                                value={formData.batchId}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        batchId: value || '',
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue>
                                        {formData.batchId
                                            ? batches.find(
                                                  (b) =>
                                                      b.id === formData.batchId,
                                              )?.species
                                            : t('batches:selectBatch', {
                                                  defaultValue: 'Select batch',
                                              })}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {batches.map((batch) => (
                                        <SelectItem
                                            key={batch.id}
                                            value={batch.id}
                                        >
                                            {batch.species} (
                                            {t('batches:remaining', {
                                                count: batch.currentQuantity,
                                                defaultValue:
                                                    '{{count}} remaining',
                                            })}
                                            )
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="cause">
                            {t('mortality:cause', { defaultValue: 'Cause' })}
                        </Label>
                        <Select
                            value={formData.cause}
                            onValueChange={(value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    cause: value || '',
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue>
                                    {formData.cause
                                        ? MORTALITY_CAUSES(t).find(
                                              (c) => c.value === formData.cause,
                                          )?.label
                                        : t('mortality:selectCause', {
                                              defaultValue: 'Select cause',
                                          })}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {MORTALITY_CAUSES(t).map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                        {c.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantity">
                            {t('common:quantity', { defaultValue: 'Quantity' })}
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={formData.quantity}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    quantity: e.target.value,
                                }))
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">
                            {t('common:date', { defaultValue: 'Date' })}
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    date: e.target.value,
                                }))
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">
                            {t('common:notes', { defaultValue: 'Notes' })}
                        </Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    notes: e.target.value,
                                }))
                            }
                            placeholder={t('mortality:notesPlaceholder', {
                                defaultValue:
                                    'Briefly explain what happened...',
                            })}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            {t('common:cancel', { defaultValue: 'Cancel' })}
                        </Button>
                        <Button
                            type="submit"
                            variant={initialData ? 'default' : 'destructive'}
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? t('common:saving', {
                                      defaultValue: 'Saving...',
                                  })
                                : initialData
                                  ? t('common:update', {
                                        defaultValue: 'Update',
                                    })
                                  : t('mortality:recordLoss', {
                                        defaultValue: 'Record Loss',
                                    })}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
