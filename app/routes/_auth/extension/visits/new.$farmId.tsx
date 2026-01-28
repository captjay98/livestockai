import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, FileText } from 'lucide-react'
import { createVisitRecordFn } from '~/features/visits/server'
import { Button } from '~/components/ui/button'
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
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

export const Route = createFileRoute('/_auth/extension/visits/new/$farmId')({
    component: CreateVisitRecord,
})

interface VisitFormData {
    visitDate: string
    visitType: string
    findings: string
    recommendations: string
    followUpDate: string
}

function CreateVisitRecord() {
    const { t } = useTranslation(['extension', 'common'])
    const router = useRouter()
    const { farmId } = Route.useParams()

    const [formData, setFormData] = useState<VisitFormData>({
        visitDate: new Date().toISOString().split('T')[0],
        visitType: '',
        findings: '',
        recommendations: '',
        followUpDate: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const visitTypes = [
        {
            value: 'routine',
            label: t('extension:visitTypes.routine', {
                defaultValue: 'Routine Check',
            }),
        },
        {
            value: 'health',
            label: t('extension:visitTypes.health', {
                defaultValue: 'Health Assessment',
            }),
        },
        {
            value: 'vaccination',
            label: t('extension:visitTypes.vaccination', {
                defaultValue: 'Vaccination',
            }),
        },
        {
            value: 'emergency',
            label: t('extension:visitTypes.emergency', {
                defaultValue: 'Emergency',
            }),
        },
        {
            value: 'training',
            label: t('extension:visitTypes.training', {
                defaultValue: 'Training',
            }),
        },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.visitType || !formData.findings) {
            setError(
                t('extension:form.required', {
                    defaultValue: 'Please fill in required fields',
                }),
            )
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            await createVisitRecordFn({
                data: {
                    farmId,
                    visitDate: new Date(formData.visitDate),
                    visitType: formData.visitType,
                    findings: formData.findings,
                    recommendations: formData.recommendations,
                    followUpDate: formData.followUpDate
                        ? new Date(formData.followUpDate)
                        : null,
                },
            })

            toast.success(
                t('extension:form.success', {
                    defaultValue: 'Visit record created successfully',
                }),
            )
            router.navigate({
                to: '/extension/farm/$farmId',
                params: { farmId },
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        router.navigate({
                            to: '/extension/farm/$farmId',
                            params: { farmId },
                        })
                    }
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('common:back', { defaultValue: 'Back' })}
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">
                        {t('extension:form.title', {
                            defaultValue: 'New Visit Record',
                        })}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('extension:form.subtitle', {
                            defaultValue: 'Record your farm visit details',
                        })}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {t('extension:form.details', {
                            defaultValue: 'Visit Details',
                        })}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="visitDate">
                                    {t('extension:form.visitDate', {
                                        defaultValue: 'Visit Date',
                                    })}{' '}
                                    *
                                </Label>
                                <Input
                                    id="visitDate"
                                    type="date"
                                    value={formData.visitDate}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            visitDate: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="visitType">
                                    {t('extension:form.visitType', {
                                        defaultValue: 'Visit Type',
                                    })}{' '}
                                    *
                                </Label>
                                <Select
                                    value={formData.visitType}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            visitType: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'extension:form.selectType',
                                                { defaultValue: 'Select type' },
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {visitTypes.map((type) => (
                                            <SelectItem
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="findings">
                                {t('extension:form.findings', {
                                    defaultValue: 'Findings',
                                })}{' '}
                                *
                            </Label>
                            <Textarea
                                id="findings"
                                value={formData.findings}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        findings: e.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'extension:form.findingsPlaceholder',
                                    {
                                        defaultValue:
                                            'Describe your observations and findings...',
                                    },
                                )}
                                rows={4}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="recommendations">
                                {t('extension:form.recommendations', {
                                    defaultValue: 'Recommendations',
                                })}
                            </Label>
                            <Textarea
                                id="recommendations"
                                value={formData.recommendations}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        recommendations: e.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'extension:form.recommendationsPlaceholder',
                                    {
                                        defaultValue:
                                            'Provide recommendations and next steps...',
                                    },
                                )}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="followUpDate">
                                {t('extension:form.followUpDate', {
                                    defaultValue: 'Follow-up Date',
                                })}
                            </Label>
                            <Input
                                id="followUpDate"
                                type="date"
                                value={formData.followUpDate}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        followUpDate: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.navigate({
                                        to: '/extension/farm/$farmId',
                                        params: { farmId },
                                    })
                                }
                                disabled={isSubmitting}
                            >
                                {t('common:cancel', { defaultValue: 'Cancel' })}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? t('common:saving', {
                                          defaultValue: 'Saving...',
                                      })
                                    : t('extension:form.create', {
                                          defaultValue: 'Create Visit Record',
                                      })}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
