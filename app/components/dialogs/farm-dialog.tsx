import { toast } from 'sonner'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { createFarmFn, updateFarmFn } from '~/features/farms/server'
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
    type: 'poultry' | 'aquaculture' | 'mixed'
}

interface FarmDialogProps {
    farm?: Farm | null // If provided, we are in edit mode
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function FarmDialog({ farm, open, onOpenChange }: FarmDialogProps) {
    const { t } = useTranslation(['farms', 'common'])
    const router = useRouter()
    const isEditing = !!farm

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        type: 'poultry' as 'poultry' | 'aquaculture' | 'mixed',
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
            if (isEditing) {
                await updateFarmFn({
                    data: {
                        farmId: farm.id,
                        name: formData.name,
                        location: formData.location,
                        type: formData.type,
                    },
                })
            } else {
                await createFarmFn({
                    data: {
                        name: formData.name,
                        location: formData.location,
                        type: formData.type,
                    },
                })
            }

            toast.success(
                isEditing
                    ? t('farms:updated', { defaultValue: 'Farm updated' })
                    : t('farms:created', { defaultValue: 'Farm created' }),
            )
            onOpenChange(false)
            router.invalidate()
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : t(
                          isEditing
                              ? 'farms:error.update'
                              : 'farms:error.create',
                          {
                              defaultValue: `Failed to ${isEditing ? 'update' : 'create'} farm`,
                          },
                      ),
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {isEditing
                            ? t('farms:editFarm', { defaultValue: 'Edit Farm' })
                            : t('farms:createNewFarm', {
                                  defaultValue: 'Create New Farm',
                              })}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? t('farms:editDescription', {
                                  defaultValue:
                                      'Update the details of your farm',
                              })
                            : t('farms:createDescription', {
                                  defaultValue:
                                      'Enter the basic information for your new farm',
                              })}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            {t('farms:farmName', { defaultValue: 'Farm Name' })}
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            placeholder={t('farms:namePlaceholder', {
                                defaultValue: 'e.g. Green Valley Farms',
                            })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">
                            {t('farms:location', { defaultValue: 'Location' })}
                        </Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    location: e.target.value,
                                }))
                            }
                            placeholder={t('farms:locationPlaceholder', {
                                defaultValue: 'e.g. Lagos, Nigeria',
                            })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">
                            {t('farms:farmType', { defaultValue: 'Farm Type' })}
                        </Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => {
                                if (
                                    value &&
                                    [
                                        'poultry',
                                        'aquaculture',
                                        'mixed',
                                    ].includes(value)
                                ) {
                                    setFormData((prev) => ({
                                        ...prev,
                                        type: value,
                                    }))
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="poultry">
                                    {t('common:livestock.poultry', {
                                        defaultValue: 'Poultry',
                                    })}
                                </SelectItem>
                                <SelectItem value="aquaculture">
                                    {t('common:livestock.aquaculture', {
                                        defaultValue: 'Aquaculture',
                                    })}
                                </SelectItem>
                                <SelectItem value="mixed">
                                    {t('common:livestock.mixed', {
                                        defaultValue: 'Mixed',
                                    })}
                                </SelectItem>
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
                            {t('common:cancel', { defaultValue: 'Cancel' })}
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                !formData.name ||
                                !formData.location
                            }
                        >
                            {isSubmitting
                                ? isEditing
                                    ? t('common:saving', {
                                          defaultValue: 'Saving...',
                                      })
                                    : t('common:creating', {
                                          defaultValue: 'Creating...',
                                      })
                                : isEditing
                                  ? t('common:saveChanges', {
                                        defaultValue: 'Save Changes',
                                    })
                                  : t('farms:createFarm', {
                                        defaultValue: 'Create Farm',
                                    })}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
