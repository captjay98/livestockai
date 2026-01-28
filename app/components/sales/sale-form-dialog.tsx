import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bird, Egg, Fish } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
    livestockType: string
    currentQuantity: number
}

interface Customer {
    id: string
    name: string
}

interface Sale {
    id: string
    livestockType: string
    batchId?: string | null
    customerId?: string | null
    quantity: number
    unitPrice: string
    date: Date
}

interface SaleFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: any) => Promise<void>
    batches: Array<Batch>
    customers: Array<Customer>
    currencySymbol: string
    formatCurrency: (value: string | number) => string
    isSubmitting: boolean
    initialData?: Sale | null
}

export function SaleFormDialog({
    open,
    onOpenChange,
    onSubmit,
    batches,
    customers,
    currencySymbol,
    formatCurrency,
    isSubmitting,
    initialData,
}: SaleFormDialogProps) {
    const { t } = useTranslation(['sales', 'common'])
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        livestockType: 'poultry' as 'poultry' | 'fish' | 'eggs',
        batchId: '',
        customerId: '',
        quantity: '',
        unitPrice: '',
        date: new Date().toISOString().split('T')[0],
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                livestockType: initialData.livestockType as
                    | 'poultry'
                    | 'fish'
                    | 'eggs',
                batchId: initialData.batchId || '',
                customerId: initialData.customerId || '',
                quantity: initialData.quantity.toString(),
                unitPrice: initialData.unitPrice,
                date: new Date(initialData.date).toISOString().split('T')[0],
            })
        } else {
            setFormData({
                livestockType: 'poultry',
                batchId: '',
                customerId: '',
                quantity: '',
                unitPrice: '',
                date: new Date().toISOString().split('T')[0],
            })
        }
        setError('')
    }, [initialData, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            await onSubmit({
                ...formData,
                quantity: parseInt(formData.quantity),
                unitPrice: parseFloat(formData.unitPrice),
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save sale')
        }
    }

    const totalAmount =
        parseInt(formData.quantity || '0') *
        parseFloat(formData.unitPrice || '0')

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {initialData
                            ? t('dialog.editTitle')
                            : t('dialog.recordTitle')}
                    </DialogTitle>
                    <DialogDescription>
                        {initialData
                            ? t('dialog.editDesc')
                            : t('dialog.recordDesc')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!initialData && (
                        <div className="space-y-2">
                            <Label>{t('labels.type')}</Label>
                            <Select
                                value={formData.livestockType}
                                onValueChange={(value) =>
                                    value &&
                                    setFormData((prev) => ({
                                        ...prev,
                                        livestockType: value,
                                        batchId: '',
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="poultry">
                                        <span className="flex items-center gap-2">
                                            <Bird className="h-4 w-4" />
                                            {t('livestockTypes.poultry')}
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="fish">
                                        <span className="flex items-center gap-2">
                                            <Fish className="h-4 w-4" />
                                            {t('livestockTypes.fish')}
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="eggs">
                                        <span className="flex items-center gap-2">
                                            <Egg className="h-4 w-4" />
                                            {t('livestockTypes.eggs')}
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {batches.length > 0 &&
                        formData.livestockType !== 'eggs' && (
                            <div className="space-y-2">
                                <Label>
                                    {t('labels.batch')} ({t('common.optional')})
                                </Label>
                                <Select
                                    value={formData.batchId || 'none'}
                                    onValueChange={(value) =>
                                        value &&
                                        setFormData((prev) => ({
                                            ...prev,
                                            batchId:
                                                value === 'none' ? '' : value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'placeholders.selectBatch',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            {t('placeholders.selectBatch')}
                                        </SelectItem>
                                        {batches
                                            .filter(
                                                (b) =>
                                                    b.livestockType ===
                                                    formData.livestockType,
                                            )
                                            .map((batch) => (
                                                <SelectItem
                                                    key={batch.id}
                                                    value={batch.id}
                                                >
                                                    {batch.species} (
                                                    {batch.currentQuantity}{' '}
                                                    available)
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                    <div className="space-y-2">
                        <Label>
                            {t('labels.customer')} ({t('common.optional')})
                        </Label>
                        <Select
                            value={formData.customerId || 'none'}
                            onValueChange={(value) =>
                                value &&
                                setFormData((prev) => ({
                                    ...prev,
                                    customerId: value === 'none' ? '' : value,
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={t(
                                        'placeholders.walkInCustomer',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    {t('placeholders.walkInCustomer')}
                                </SelectItem>
                                {customers.map((customer) => (
                                    <SelectItem
                                        key={customer.id}
                                        value={customer.id}
                                    >
                                        {customer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t('labels.quantity')}</Label>
                            <Input
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        quantity: e.target.value,
                                    }))
                                }
                                placeholder="0"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>
                                {t('labels.unitPrice')} ({currencySymbol})
                            </Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.unitPrice}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        unitPrice: e.target.value,
                                    }))
                                }
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('labels.date')}</Label>
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

                    {formData.quantity && formData.unitPrice && (
                        <div className="p-3 bg-muted rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                    {t('labels.total')}:
                                </span>
                                <span className="text-lg font-bold text-success">
                                    {formatCurrency(totalAmount)}
                                </span>
                            </div>
                        </div>
                    )}

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
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                !formData.quantity ||
                                !formData.unitPrice
                            }
                        >
                            {isSubmitting
                                ? t('common.saving')
                                : initialData
                                  ? t('common.save')
                                  : t('record')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
