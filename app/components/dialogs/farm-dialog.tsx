import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { createFarmFn, updateFarmFn } from '~/lib/farms/server'
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

interface Farm {
    id: string
    name: string
    location: string
    type: 'poultry' | 'fishery' | 'mixed'
}

interface FarmDialogProps {
    farm?: Farm | null // If provided, we are in edit mode
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function FarmDialog({ farm, open, onOpenChange }: FarmDialogProps) {
    const router = useRouter()
    const isEditing = !!farm

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        type: 'poultry' as 'poultry' | 'fishery' | 'mixed',
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Initialize form data when opening/changing farm
    useEffect(() => {
        if (open) {
            if (farm) {
                setFormData({
                    name: farm.name,
                    location: farm.location,
                    type: farm.type,
                })
            } else {
                // Reset for create mode
                setFormData({
                    name: '',
                    location: '',
                    type: 'poultry',
                })
            }
            setError('')
        }
    }, [open, farm])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        try {
            if (isEditing && farm) {
                await updateFarmFn({
                    data: {
                        farmId: farm.id,
                        name: formData.name,
                        location: formData.location,
                        type: formData.type,
                    }
                })
            } else {
                await createFarmFn({
                    data: {
                        name: formData.name,
                        location: formData.location,
                        type: formData.type,
                    }
                })
            }

            onOpenChange(false)
            router.invalidate()
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'create'} farm`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {isEditing ? 'Edit Farm' : 'Create New Farm'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the details of your farm'
                            : 'Enter the basic information for your new farm'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Farm Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="e.g. Green Valley Farms"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    location: e.target.value,
                                }))
                            }
                            placeholder="e.g. Lagos, Nigeria"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Farm Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => {
                                if (['poultry', 'fishery', 'mixed'].includes(value)) {
                                    setFormData((prev) => ({ ...prev, type: value as any }))
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="poultry">Poultry</SelectItem>
                                <SelectItem value="fishery">Fishery</SelectItem>
                                <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                        </Select>
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
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting || !formData.name || !formData.location
                            }
                        >
                            {isSubmitting
                                ? (isEditing ? 'Saving...' : 'Creating...')
                                : (isEditing ? 'Save Changes' : 'Create Farm')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
