import { useTranslation } from 'react-i18next'
import { AlertTriangle, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface VaccinationAlert {
    id: string
    batchId: string
    vaccineName: string
    species: string | null
    livestockType: string | null
    nextDueDate: Date | null
    farmName: string | null
}

interface HealthAlertsProps {
    alerts: {
        upcoming: Array<VaccinationAlert>
        overdue: Array<VaccinationAlert>
    }
    formatDate: (date: Date) => string
}

export function HealthAlerts({ alerts, formatDate }: HealthAlertsProps) {
    const { t } = useTranslation(['health'])

    if (alerts.upcoming.length === 0 && alerts.overdue.length === 0) return null

    return (
        <div className="grid gap-4 mb-6 md:grid-cols-2">
            {alerts.overdue.length > 0 && (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium text-destructive flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            {t('vaccinations:alerts.overdue')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 text-sm space-y-2">
                        {alerts.overdue.map((a) => (
                            <div
                                key={a.id}
                                className="flex justify-between items-center"
                            >
                                <span>
                                    {a.vaccineName} ({a.species})
                                </span>
                                <span className="font-medium">
                                    {a.nextDueDate
                                        ? formatDate(new Date(a.nextDueDate))
                                        : 'N/A'}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
            {alerts.upcoming.length > 0 && (
                <Card className="border-info/50 bg-info/5">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium text-info flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {t('vaccinations:alerts.upcoming')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 text-sm space-y-2">
                        {alerts.upcoming.map((a) => (
                            <div
                                key={a.id}
                                className="flex justify-between items-center"
                            >
                                <span>
                                    {a.vaccineName} ({a.species})
                                </span>
                                <span className="font-medium">
                                    {a.nextDueDate
                                        ? formatDate(new Date(a.nextDueDate))
                                        : 'N/A'}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
