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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'

export interface WeightFormData {
    batchId: string
    date: string
    sampleSize: string
    averageWeightKg: string
}

interface Batch {
    id: string
    species: string
    currentQuantity: number
    status: string
}

interface WeightFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'create' | 'edit'
    initialData?: WeightFormData | null
    batchSpecies?: string // For display in edit mode
    batches: Array<Batch>
    onSubmit: (data: WeightFormData) => Promise<void>
    isSubmitting: boolean
}

export function WeightFormDialog({
    open,
    onOpenChange,
    mode,
    initialData,
    batchSpecies,
    batches,
    onSubmit,
    isSubmitting,
}: WeightFormDialogProps) {
    const { t } = useTranslation(['weight', 'common', 'batches'])
    const [formData, setFormData] = useState<WeightFormData>({
        batchId: '',
        date: new Date().toISOString().split('T')[0],
        sampleSize: '',
        averageWeightKg: '',
    })
    const [error, setError] = useState('')

    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setFormData(initialData)
            } else {
                setFormData({
                    batchId: '',
                    date: new Date().toISOString().split('T')[0],
                    sampleSize: '',
                    averageWeightKg: '',
                })
            }
            setError('')
        }
    }, [open, mode, initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            await onSubmit(formData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create'
                            ? t('weight:addSampleTitle', {
                                  defaultValue: 'Record Weight Sample',
                              })
                            : t('weight:editSampleTitle', {
                                  defaultValue: 'Edit Weight Sample',
                              })}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>
                            {t('batches:batch', { defaultValue: 'Batch' })}
                        </Label>
                        {mode === 'create' ? (
                            <Select
                                value={formData.batchId}
                                onValueChange={(val) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        batchId: val || '',
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
                                            {t('batches:activeCount', {
                                                count: batch.currentQuantity,
                                                defaultValue:
                                                    '{{count}} active',
                                            })}
                                            )
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input value={batchSpecies || ''} disabled />
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>
                            {t('common:date', { defaultValue: 'Date' })}
                        </Label>
                        <Input
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>
                                {t('weight:avgWeightWithUnit', {
                                    defaultValue: 'Avg Weight (kg)',
                                })}
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.averageWeightKg}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        averageWeightKg: e.target.value,
                                    }))
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>
                                {t('weight:sampleSize', {
                                    defaultValue: 'Sample Size',
                                })}
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                value={formData.sampleSize}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        sampleSize: e.target.value,
                                    }))
                                }
                                required
                            />
                        </div>
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
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            {t('common:cancel', { defaultValue: 'Cancel' })}
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                (mode === 'create' && !formData.batchId) ||
                                !formData.averageWeightKg
                            }
                        >
                            {isSubmitting
                                ? t('common:saving', {
                                      defaultValue: 'Saving...',
                                  })
                                : mode === 'create'
                                  ? t('weight:saveSample', {
                                        defaultValue: 'Save Sample',
                                    })
                                  : t('common:saveChanges', {
                                        defaultValue: 'Save Changes',
                                    })}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
