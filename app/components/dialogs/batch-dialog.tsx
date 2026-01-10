import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { createBatchFn } from '~/lib/batches/server'
import { Button } from '~/components/ui/button'
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
} from '~/components/ui/dialog'

interface BatchDialogProps {
    farmId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

const LIVESTOCK_TYPES = [
    { value: 'poultry', label: 'Poultry' },
    { value: 'fish', label: 'Fish' },
]

const SPECIES_OPTIONS = {
    poultry: [
        { value: 'broiler', label: 'Broiler' },
        { value: 'layer', label: 'Layer' },
        { value: 'cockerel', label: 'Cockerel' },
        { value: 'turkey', label: 'Turkey' },
    ],
    fish: [
        { value: 'catfish', label: 'Catfish' },
        { value: 'tilapia', label: 'Tilapia' },
    ],
}

export function BatchDialog({ farmId, open, onOpenChange }: BatchDialogProps) {
    const router = useRouter()
    const [formData, setFormData] = useState({
        livestockType: '' as 'poultry' | 'fish' | '',
        species: '',
        initialQuantity: '',
        costPerUnit: '',
        acquisitionDate: new Date().toISOString().split('T')[0],
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Reset species when livestock type changes
    useEffect(() => {
        setFormData((prev) => ({ ...prev, species: '' }))
    }, [formData.livestockType])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.livestockType) return
        setIsSubmitting(true)
        setError('')

        try {
            await createBatchFn({
                data: {
                    batch: {
                        farmId,
                        livestockType: formData.livestockType,
                        species: formData.species,
                        initialQuantity: parseInt(formData.initialQuantity),
                        costPerUnit: parseFloat(formData.costPerUnit),
                        acquisitionDate: new Date(formData.acquisitionDate),
                    },
                },
            })
            onOpenChange(false)
            setFormData({
                livestockType: '',
                species: '',
                initialQuantity: '',
                costPerUnit: '',
                acquisitionDate: new Date().toISOString().split('T')[0],
            })
            router.invalidate()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create batch')
        } finally {
            setIsSubmitting(false)
        }
    }

    const speciesOptions = formData.livestockType
        ? SPECIES_OPTIONS[formData.livestockType]
        : []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Add New Batch
                    </DialogTitle>
                    <DialogDescription>Create a new livestock batch</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="livestockType">Livestock Type</Label>
                        <Select
                            value={formData.livestockType}
                            onValueChange={(value) =>
                                value &&
                                setFormData((prev) => ({
                                    ...prev,
                                    livestockType: value as 'poultry' | 'fish',
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue>
                                    {formData.livestockType
                                        ? LIVESTOCK_TYPES.find(
                                            (t) => t.value === formData.livestockType,
                                        )?.label
                                        : 'Select type'}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {LIVESTOCK_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.livestockType && (
                        <div className="space-y-2">
                            <Label htmlFor="species">Species</Label>
                            <Select
                                value={formData.species}
                                onValueChange={(value) =>
                                    value && setFormData((prev) => ({ ...prev, species: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue>
                                        {formData.species
                                            ? speciesOptions.find((s) => s.value === formData.species)
                                                ?.label
                                            : 'Select species'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {speciesOptions.map((species) => (
                                        <SelectItem key={species.value} value={species.value}>
                                            {species.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="initialQuantity">Quantity</Label>
                            <Input
                                id="initialQuantity"
                                type="number"
                                min="1"
                                value={formData.initialQuantity}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        initialQuantity: e.target.value,
                                    }))
                                }
                                placeholder="100"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="costPerUnit">Cost/Unit (₦)</Label>
                            <Input
                                id="costPerUnit"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.costPerUnit}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        costPerUnit: e.target.value,
                                    }))
                                }
                                placeholder="500"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="acquisitionDate">Acquisition Date</Label>
                        <Input
                            id="acquisitionDate"
                            type="date"
                            value={formData.acquisitionDate}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    acquisitionDate: e.target.value,
                                }))
                            }
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                !formData.livestockType ||
                                !formData.species ||
                                !formData.initialQuantity ||
                                !formData.costPerUnit
                            }
                        >
                            {isSubmitting ? 'Creating...' : 'Create Batch'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
