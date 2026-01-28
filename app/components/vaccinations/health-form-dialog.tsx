import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog'
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
    currentQuantity: number
}

interface HealthRecord {
    id: string
    batchId: string
    type: 'vaccination' | 'treatment'
    name: string
    date: Date
    dosage: string
    notes?: string
    reason?: string
    withdrawalDays?: number
    nextDueDate?: Date
}

interface HealthFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: any) => Promise<void>
    batches: Array<Batch>
    type: 'vaccination' | 'treatment' | 'edit'
    isSubmitting: boolean
    initialData?: HealthRecord | null
}

export function HealthFormDialog({
    open,
    onOpenChange,
    onSubmit,
    batches,
    type,
    isSubmitting,
    initialData,
}: HealthFormDialogProps) {
    const { t } = useTranslation(['health', 'common', 'batches'])
    const [formData, setFormData] = useState({
        batchId: '',
        name: '',
        date: new Date().toISOString().split('T')[0],
        dosage: '',
        nextDueDate: '',
        reason: '',
        withdrawalDays: '0',
        notes: '',
    })

    const formType = initialData
        ? initialData.type
        : type === 'edit'
          ? 'vaccination'
          : type

    useEffect(() => {
        if (initialData) {
            setFormData({
                batchId: initialData.batchId,
                name: initialData.name,
                date: new Date(initialData.date).toISOString().split('T')[0],
                dosage: initialData.dosage,
                nextDueDate: initialData.nextDueDate
                    ? new Date(initialData.nextDueDate)
                          .toISOString()
                          .split('T')[0]
                    : '',
                reason: initialData.reason || '',
                withdrawalDays: (initialData.withdrawalDays || 0).toString(),
                notes: initialData.notes || '',
            })
        } else {
            setFormData({
                batchId: '',
                name: '',
                date: new Date().toISOString().split('T')[0],
                dosage: '',
                nextDueDate: '',
                reason: '',
                withdrawalDays: '0',
                notes: '',
            })
        }
    }, [initialData, open, type])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit({
            ...formData,
            type: formType,
            withdrawalDays: parseInt(formData.withdrawalDays),
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {initialData
                            ? t('common:edit')
                            : formType === 'vaccination'
                              ? t('vaccinations:dialog.vaccinationTitle')
                              : t('vaccinations:dialog.treatmentTitle')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!initialData && (
                        <div className="space-y-2">
                            <Label>
                                {t('batches:batch', { defaultValue: 'Batch' })}
                            </Label>
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
                                    <SelectValue
                                        placeholder={t(
                                            'batches:placeholders.selectBatch',
                                            {
                                                defaultValue: 'Select a batch',
                                            },
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {batches.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.species} ({b.currentQuantity})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>
                            {formType === 'vaccination'
                                ? t('vaccinations:labels.vaccineName')
                                : t('vaccinations:labels.medicationName')}
                        </Label>
                        <Input
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            required
                        />
                    </div>

                    {formType === 'treatment' && (
                        <div className="space-y-2">
                            <Label>{t('vaccinations:labels.reason')}</Label>
                            <Input
                                value={formData.reason}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        reason: e.target.value,
                                    }))
                                }
                                required
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t('common:date')}</Label>
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
                        <div className="space-y-2">
                            <Label>{t('common:dosage')}</Label>
                            <Input
                                value={formData.dosage}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        dosage: e.target.value,
                                    }))
                                }
                                required
                                placeholder="e.g. 10ml"
                            />
                        </div>
                    </div>

                    {formType === 'vaccination' ? (
                        <div className="space-y-2">
                            <Label>
                                {t('vaccinations:labels.nextDueDate')} (
                                {t('common:optional')})
                            </Label>
                            <Input
                                type="date"
                                value={formData.nextDueDate}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        nextDueDate: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>
                                {t('vaccinations:labels.withdrawalDays')}
                            </Label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.withdrawalDays}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        withdrawalDays: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>{t('common:notes')}</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    notes: e.target.value,
                                }))
                            }
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            {t('common:cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                !formData.name ||
                                (!initialData && !formData.batchId)
                            }
                        >
                            {isSubmitting
                                ? t('common:saving')
                                : t('common:save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
