import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

interface Visit {
    id: string
    visitDate: Date
    visitType: string
    findings: string
    recommendations: string
}

interface VisitCardProps {
    visit: Visit
}

export function VisitCard({ visit }: VisitCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Visit Record</span>
                    <Badge variant="outline">{visit.visitType}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <p className="text-sm">
                        <strong>Date:</strong> {visit.visitDate.toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                        <strong>Findings:</strong> {visit.findings}
                    </p>
                    <p className="text-sm">
                        <strong>Recommendations:</strong> {visit.recommendations}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}