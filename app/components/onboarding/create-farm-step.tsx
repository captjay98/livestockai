import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Home } from 'lucide-react'
import { toast } from 'sonner'
import type { CreateFarmData } from '~/features/farms/service'
import { useOnboarding } from '~/features/onboarding/context'
import { createFarmFn } from '~/features/farms/server'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'

type FarmType =
    | 'poultry'
    | 'aquaculture'
    | 'mixed'
    | 'cattle'
    | 'goats'
    | 'sheep'
    | 'bees'
    | 'multi'

export function CreateFarmStep() {
    const { t } = useTranslation(['onboarding', 'common', 'farms'])
    const { completeStep, setFarmId, skipStep } = useOnboarding()
    const [formData, setFormData] = useState<CreateFarmData>({
        name: '',
        location: '',
        type: 'poultry',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')
        try {
            const farmId = await createFarmFn({ data: formData })
            if (farmId) setFarmId(farmId)
            toast.success(
                t('createFarm.success', { defaultValue: 'Farm created' }),
            )
            completeStep('create-farm')
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : t('createFarm.error', {
                          defaultValue: 'Failed to create farm',
                      }),
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                    <Home className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold">
                    {t('createFarm.title', {
                        defaultValue: 'Create Your Farm',
                    })}
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    {t('createFarm.desc', {
                        defaultValue:
                            'A farm is your main workspace with its own batches and records.',
                    })}
                </p>
            </div>
            <Card className="max-w-md mx-auto">
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                {t('createFarm.form.name', {
                                    defaultValue: 'Farm Name',
                                })}
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((p: CreateFarmData) => ({
                                        ...p,
                                        name: e.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'createFarm.form.namePlaceholder',
                                    {
                                        defaultValue:
                                            'e.g., Sunshine Poultry Farm',
                                    },
                                )}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">
                                {t('createFarm.form.location', {
                                    defaultValue: 'Location',
                                })}
                            </Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) =>
                                    setFormData((p: CreateFarmData) => ({
                                        ...p,
                                        location: e.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'onboarding.createFarm.form.locationPlaceholder',
                                    { defaultValue: 'e.g., Lagos, Nigeria' },
                                )}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>
                                {t('createFarm.form.type', {
                                    defaultValue: 'Farm Type',
                                })}
                            </Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v) => {
                                    if (v)
                                        setFormData((p: CreateFarmData) => ({
                                            ...p,
                                            type: v as FarmType,
                                        }))
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="poultry">
                                        🐔{' '}
                                        {t('farms:types.poultry', {
                                            defaultValue: 'Poultry',
                                        })}
                                    </SelectItem>
                                    <SelectItem value="aquaculture">
                                        🐟{' '}
                                        {t('farms:types.aquaculture', {
                                            defaultValue:
                                                'Aquaculture (Fish Farming)',
                                        })}
                                    </SelectItem>
                                    <SelectItem value="cattle">
                                        🐄{' '}
                                        {t('farms:types.cattle', {
                                            defaultValue: 'Cattle',
                                        })}
                                    </SelectItem>
                                    <SelectItem value="goats">
                                        🐐{' '}
                                        {t('farms:types.goats', {
                                            defaultValue: 'Goats',
                                        })}
                                    </SelectItem>
                                    <SelectItem value="sheep">
                                        🐑{' '}
                                        {t('farms:types.sheep', {
                                            defaultValue: 'Sheep',
                                        })}
                                    </SelectItem>
                                    <SelectItem value="bees">
                                        🐝{' '}
                                        {t('farms:types.bees', {
                                            defaultValue: 'Bees (Apiary)',
                                        })}
                                    </SelectItem>
                                    <SelectItem value="mixed">
                                        🏠{' '}
                                        {t('farms:types.mixed', {
                                            defaultValue:
                                                'Mixed (Multiple Types)',
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
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={skipStep}
                                disabled={isSubmitting}
                            >
                                {t('common:skip', { defaultValue: 'Skip' })}
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={
                                    isSubmitting ||
                                    !formData.name ||
                                    !formData.location
                                }
                            >
                                {isSubmitting
                                    ? t('createFarm.form.submitting', {
                                          defaultValue: 'Creating...',
                                      })
                                    : t('createFarm.form.submit', {
                                          defaultValue: 'Create Farm',
                                      })}{' '}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
