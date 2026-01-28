import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Breed } from '~/features/breeds/types'
import { getBreedsForSpeciesFn } from '~/features/breeds/server'
import { Button } from '~/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
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

interface Batch {
    id: string
    species: string
    breedId?: string | null
    currentQuantity: number
    status: string
}

interface BatchEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    batch: Batch | null
    onSubmit: (data: {
        currentQuantity: string
        status: 'active' | 'depleted' | 'sold'
        breedId: string | null
    }) => Promise<void>
    isSubmitting: boolean
}

export function BatchEditDialog({
    open,
    onOpenChange,
    batch,
    onSubmit,
    isSubmitting,
}: BatchEditDialogProps) {
    const { t } = useTranslation(['batches', 'common'])
    const [formData, setFormData] = useState({
        currentQuantity: '',
        status: 'active' as 'active' | 'depleted' | 'sold',
        breedId: '' as string | null,
    })
    const [breeds, setBreeds] = useState<Array<Breed>>([])
    const [isLoadingBreeds, setIsLoadingBreeds] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (batch) {
            setFormData({
                currentQuantity: batch.currentQuantity.toString(),
                status: batch.status as 'active' | 'depleted' | 'sold',
                breedId: batch.breedId || '',
            })

            // Fetch breeds for this species
            const fetchBreeds = async () => {
                setIsLoadingBreeds(true)
                try {
                    const result = await getBreedsForSpeciesFn({
                        data: { speciesKey: batch.species },
                    })
                    setBreeds(result)
                } catch (err) {
                    console.error('Failed to fetch breeds:', err)
                } finally {
                    setIsLoadingBreeds(false)
                }
            }
            fetchBreeds()
        }
    }, [batch])

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
                        {t('dialog.editTitle', { defaultValue: 'Edit Batch' })}
                    </DialogTitle>
                    <DialogDescription>
                        {t('dialog.editDescription', {
                            defaultValue: 'Update batch information',
                        })}
                    </DialogDescription>
                </DialogHeader>
                {batch && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>
                                {t('species', { defaultValue: 'Species' })}
                            </Label>
                            <Input value={batch.species} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-current-quantity">
                                {t('quantity', { defaultValue: 'Quantity' })}
                            </Label>
                            <Input
                                id="edit-current-quantity"
                                type="number"
                                min="0"
                                value={formData.currentQuantity}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        currentQuantity: e.target.value,
                                    }))
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-status">
                                {t('columns.status', {
                                    defaultValue: 'Status',
                                })}
                            </Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: string | null) => {
                                    if (
                                        value === 'active' ||
                                        value === 'depleted' ||
                                        value === 'sold'
                                    ) {
                                        setFormData((prev) => ({
                                            ...prev,
                                            status: value,
                                        }))
                                    }
                                }}
                            >
                                <SelectTrigger id="edit-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        {t('statuses.active', {
                                            defaultValue: 'Active',
                                        })}
                                    </SelectItem>
                                    <SelectItem value="depleted">
                                        {t('statuses.depleted', {
                                            defaultValue: 'Depleted',
                                        })}
                                    </SelectItem>
                                    <SelectItem value="sold">
                                        {t('statuses.sold', {
                                            defaultValue: 'Sold',
                                        })}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {breeds.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="edit-breed">
                                        {t('breed')}
                                    </Label>
                                    {isLoadingBreeds && (
                                        <span className="text-[10px] text-muted-foreground animate-pulse">
                                            Loading...
                                        </span>
                                    )}
                                </div>
                                <Select
                                    value={formData.breedId || 'none'}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            breedId:
                                                value === 'none' ? null : value,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="edit-breed">
                                        <SelectValue>
                                            {formData.breedId
                                                ? breeds.find(
                                                      (b) =>
                                                          b.id ===
                                                          formData.breedId,
                                                  )?.displayName
                                                : t(
                                                      'placeholders.selectBreed',
                                                      {
                                                          defaultValue:
                                                              'Select breed',
                                                      },
                                                  )}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            {t('common:none', {
                                                defaultValue: 'None',
                                            })}
                                        </SelectItem>
                                        {breeds.map((breed) => (
                                            <SelectItem
                                                key={breed.id}
                                                value={breed.id}
                                            >
                                                {breed.displayName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                {t('common:cancel', { defaultValue: 'Cancel' })}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? t('common:saving', {
                                          defaultValue: 'Saving...',
                                      })
                                    : t('common:save', {
                                          defaultValue: 'Save',
                                      })}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
