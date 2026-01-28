import { createFileRoute } from '@tanstack/react-router'
import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    Shield,
    TrendingUp,
    XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Progress } from '~/components/ui/progress'
import { verifyReportFn } from '~/features/credit-passport/server'

export const Route = createFileRoute('/verify/$reportId')({
    loader: async ({ params }) => {
        return verifyReportFn({ data: { reportId: params.reportId } })
    },
    component: VerificationPage,
    errorComponent: ({ error }) => (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <CardTitle className="text-red-600">
                        Verification Failed
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-muted-foreground">
                        {error.message ||
                            'This report could not be verified. It may be invalid or expired.'}
                    </p>
                </CardContent>
            </Card>
        </div>
    ),
})

function VerificationPage() {
    const report = Route.useLoaderData()

    const isExpired = report.expired
    const isValid = report.isValid && !isExpired

    const getStatusIcon = () => {
        if (isExpired)
            return <AlertTriangle className="h-8 w-8 text-yellow-500" />
        if (isValid) return <CheckCircle className="h-8 w-8 text-green-500" />
        return <XCircle className="h-8 w-8 text-red-500" />
    }

    const getStatusText = () => {
        if (isExpired) return 'Expired'
        if (isValid) return 'Verified'
        return 'Invalid'
    }

    const getStatusColor = () => {
        if (isExpired) return 'bg-yellow-100 text-yellow-800'
        if (isValid) return 'bg-green-100 text-green-800'
        return 'bg-red-100 text-red-800'
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const getDataFreshness = () => {
        const daysSinceGeneration = Math.floor(
            (Date.now() - new Date(report.createdAt).getTime()) /
                (1000 * 60 * 60 * 24),
        )

        if (daysSinceGeneration <= 7)
            return { label: 'Very Fresh', color: 'text-green-600', value: 100 }
        if (daysSinceGeneration <= 30)
            return { label: 'Fresh', color: 'text-blue-600', value: 80 }
        if (daysSinceGeneration <= 60)
            return { label: 'Moderate', color: 'text-yellow-600', value: 60 }
        return { label: 'Aging', color: 'text-red-600', value: 40 }
    }

    const freshness = getDataFreshness()

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center py-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Shield className="h-10 w-10 text-blue-600" />
                        <h1 className="text-3xl font-bold">
                            OpenLivestock Credit Passport
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Blockchain-verified livestock farming credentials
                    </p>
                </div>

                {/* Verification Status */}
                <Card>
                    <CardHeader className="text-center">
                        {getStatusIcon()}
                        <CardTitle className="mt-4">
                            <Badge className={getStatusColor()}>
                                {getStatusText()}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground">
                            Report ID:{' '}
                            <code className="bg-muted px-2 py-1 rounded text-sm">
                                {report.id}
                            </code>
                        </p>
                    </CardContent>
                </Card>

                {isValid && (
                    <>
                        {/* Credit Metrics */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Credit Score
                                    </CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        {report.publicMetrics.creditScore ||
                                            'N/A'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Grade:{' '}
                                        {report.publicMetrics.creditGrade ||
                                            'Unrated'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Production Capacity
                                    </CardTitle>
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {report.publicMetrics
                                            .productionCapacity || 'N/A'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Units per cycle
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Sustainability Score
                                    </CardTitle>
                                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {report.publicMetrics
                                            .sustainabilityScore || 'N/A'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Environmental impact rating
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Data Freshness */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Data Freshness
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        Freshness Level
                                    </span>
                                    <span
                                        className={`text-sm font-medium ${freshness.color}`}
                                    >
                                        {freshness.label}
                                    </span>
                                </div>
                                <Progress
                                    value={freshness.value}
                                    className="w-full"
                                />
                                <div className="text-xs text-muted-foreground">
                                    Data reflects farm operations as of{' '}
                                    {formatDate(report.createdAt)}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* Report Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Report Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm font-medium">
                                    Report Type:
                                </span>
                                <p className="text-sm text-muted-foreground capitalize">
                                    {report.reportType.replace('_', ' ')}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium">
                                    Generated:
                                </span>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(report.createdAt)}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium">
                                    Expires:
                                </span>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(report.expiresAt)}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium">
                                    Verification Count:
                                </span>
                                <p className="text-sm text-muted-foreground">
                                    {report.verificationCount || 0} times
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center py-8 text-sm text-muted-foreground">
                    <p>
                        This report is cryptographically signed and
                        tamper-proof.
                    </p>
                    <p>
                        Powered by OpenLivestock Manager - Open Source Livestock
                        Management
                    </p>
                </div>
            </div>
        </div>
    )
}
