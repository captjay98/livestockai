import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
    AlertCircle,
    BookOpen,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    Shield,
    Stethoscope,
    User,
} from 'lucide-react'
import { acknowledgeVisitFn } from '~/features/extension/server'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '~/components/ui/collapsible'

interface Visit {
    id: string
    visitDate: Date
    visitType: string
    findings: string
    recommendations: string
    followUpDate?: Date | null
    agentName: string
    acknowledged: boolean
    acknowledgedAt?: Date | null
}

interface VisitCardProps {
    visit: Visit
}

const getVisitTypeIcon = (type: string) => {
    switch (type) {
        case 'routine':
            return <Clock className="h-4 w-4" />
        case 'health':
            return <Stethoscope className="h-4 w-4" />
        case 'vaccination':
            return <Shield className="h-4 w-4" />
        case 'emergency':
            return <AlertCircle className="h-4 w-4" />
        case 'training':
            return <BookOpen className="h-4 w-4" />
        default:
            return <Calendar className="h-4 w-4" />
    }
}

const getVisitTypeColor = (type: string) => {
    switch (type) {
        case 'routine':
            return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'health':
            return 'bg-green-100 text-green-800 border-green-200'
        case 'vaccination':
            return 'bg-purple-100 text-purple-800 border-purple-200'
        case 'emergency':
            return 'bg-red-100 text-red-800 border-red-200'
        case 'training':
            return 'bg-orange-100 text-orange-800 border-orange-200'
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200'
    }
}

export function VisitCard({ visit }: VisitCardProps) {
    const { t } = useTranslation(['extension', 'common'])
    const [isExpanded, setIsExpanded] = useState(false)
    const [isAcknowledging, setIsAcknowledging] = useState(false)

    const handleAcknowledge = async () => {
        setIsAcknowledging(true)
        try {
            await acknowledgeVisitFn({ data: { id: visit.id } })
            toast.success(
                t('extension:visit.acknowledged', {
                    defaultValue: 'Visit acknowledged successfully',
                }),
            )
            // Note: In a real app, you'd want to invalidate queries or update state
        } catch (err) {
            toast.error(
                t('extension:visit.acknowledgeError', {
                    defaultValue: 'Failed to acknowledge visit',
                }),
            )
        } finally {
            setIsAcknowledging(false)
        }
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(date))
    }

    return (
        <Card
            className={`transition-all ${visit.acknowledged ? 'opacity-75' : ''}`}
        >
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge
                                variant="outline"
                                className={`flex items-center gap-1 ${getVisitTypeColor(visit.visitType)}`}
                            >
                                {getVisitTypeIcon(visit.visitType)}
                                {t(`extension:visitTypes.${visit.visitType}`, {
                                    defaultValue: visit.visitType,
                                })}
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                                {formatDate(visit.visitDate)}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {visit.acknowledged && (
                                <Badge
                                    variant="outline"
                                    className="bg-green-50 text-green-700 border-green-200"
                                >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {t('extension:visit.acknowledged', {
                                        defaultValue: 'Acknowledged',
                                    })}
                                </Badge>
                            )}
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{visit.agentName}</span>
                    </div>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                        <div>
                            <h4 className="font-medium text-sm mb-2">
                                {t('extension:visit.findings', {
                                    defaultValue: 'Findings',
                                })}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {visit.findings}
                            </p>
                        </div>

                        {visit.recommendations && (
                            <div>
                                <h4 className="font-medium text-sm mb-2">
                                    {t('extension:visit.recommendations', {
                                        defaultValue: 'Recommendations',
                                    })}
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {visit.recommendations}
                                </p>
                            </div>
                        )}

                        {visit.followUpDate && (
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    {t('extension:visit.followUp', {
                                        defaultValue: 'Follow-up',
                                    })}
                                    :
                                </span>
                                <span className="font-medium">
                                    {formatDate(visit.followUpDate)}
                                </span>
                            </div>
                        )}

                        {!visit.acknowledged && (
                            <div className="flex justify-end pt-2 border-t">
                                <Button
                                    size="sm"
                                    onClick={handleAcknowledge}
                                    disabled={isAcknowledging}
                                >
                                    {isAcknowledging ? (
                                        t('common:processing', {
                                            defaultValue: 'Processing...',
                                        })
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            {t('extension:visit.acknowledge', {
                                                defaultValue: 'Acknowledge',
                                            })}
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {visit.acknowledged && visit.acknowledgedAt && (
                            <div className="text-xs text-muted-foreground pt-2 border-t">
                                {t('extension:visit.acknowledgedAt', {
                                    defaultValue: 'Acknowledged on',
                                })}
                                : {formatDate(visit.acknowledgedAt)}
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    )
}
