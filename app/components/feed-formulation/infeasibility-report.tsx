import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '~/components/ui/alert'

interface InfeasibilityReportProps {
    report: string
}

export function InfeasibilityReport({ report }: InfeasibilityReportProps) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
                {report ||
                    'No feasible solution found with current constraints and ingredient prices.'}
            </AlertDescription>
        </Alert>
    )
}
