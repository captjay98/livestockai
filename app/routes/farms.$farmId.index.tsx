import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getFarmById, getFarmStats } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
import { formatNaira } from '~/lib/currency'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { ArrowLeft, Edit, MapPin, Building2, Users, TrendingUp, TrendingDown } from 'lucide-react'

interface Farm {
    id: string
    name: string
    location: string
    type: 'poultry' | 'fishery' | 'mixed'
    createdAt: Date
    updatedAt: Date
}

interface FarmStats {
    batches: { total: number; active: number; totalLivestock: number }
    sales: { count: number; revenue: number }
    expenses: { count: number; amount: number }
}

interface FarmData {
    farm: Farm | null
    stats: FarmStats
}

const getFarmDetails = createServerFn({ method: 'GET' })
    .inputValidator((data: { farmId: string }) => data)
    .handler(async ({ data }) => {
        try {
            const session = await requireAuth()

            const [farm, stats] = await Promise.all([
                getFarmById(data.farmId, session.user.id),
                getFarmStats(data.farmId, session.user.id),
            ])
            return { farm, stats }
        } catch (error) {
            if (error instanceof Error && error.message === 'UNAUTHORIZED') {
                throw redirect({ to: '/login' })
            }
            throw error
        }
    })

export const Route = createFileRoute('/farms/$farmId/')({
    component: FarmDetailsPage,
    loader: ({ params }) => getFarmDetails({ data: { farmId: params.farmId } }),
})

function FarmDetailsPage() {
    const { farm, stats } = Route.useLoaderData() as FarmData
    const { farmId } = Route.useParams()

    if (!farm) {
        return (
            <div className="container mx-auto py-6 px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Farm not found</h1>
                    <p className="text-muted-foreground mb-4">
                        The farm you're looking for doesn't exist or you don't have access to it.
                    </p>
                    <Link to="/farms">
                        <Button>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Farms
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/farms">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Farms
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">{farm.name}</h1>
                        <Badge variant={
                            farm.type === 'poultry' ? 'default' :
                                farm.type === 'fishery' ? 'secondary' : 'outline'
                        }>
                            {farm.type}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {farm.location}
                    </p>
                </div>
                <Link to="/farms/$farmId/edit" params={{ farmId }}>
                    <Button>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Farm
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-8">
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Livestock</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.batches.totalLivestock.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{stats.batches.active} active batches</p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue (30 days)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNaira(stats.sales.revenue)}</div>
                        <p className="text-xs text-muted-foreground">{stats.sales.count} sales</p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expenses (30 days)</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNaira(stats.expenses.amount)}</div>
                        <p className="text-xs text-muted-foreground">{stats.expenses.count} transactions</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks for managing this farm</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Link to="/batches" search={{ farmId }} className="w-full">
                            <Button variant="outline" className="h-auto p-4 w-full glass">
                                <div className="text-center">
                                    <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                                    <div className="font-medium">Manage Batches</div>
                                    <div className="text-xs text-muted-foreground">View and manage livestock batches</div>
                                </div>
                            </Button>
                        </Link>

                        <Link to="/sales/new" search={{ farmId }} className="w-full">
                            <Button variant="outline" className="h-auto p-4 w-full glass text-emerald-600">
                                <div className="text-center">
                                    <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                                    <div className="font-medium">Record Sale</div>
                                    <div className="text-xs text-muted-foreground">Add new sales transactions</div>
                                </div>
                            </Button>
                        </Link>

                        <Link to="/expenses/new" search={{ farmId }} className="w-full">
                            <Button variant="outline" className="h-auto p-4 w-full glass text-destructive">
                                <div className="text-center">
                                    <TrendingDown className="h-6 w-6 mx-auto mb-2" />
                                    <div className="font-medium">Record Expense</div>
                                    <div className="text-xs text-muted-foreground">Add new expense records</div>
                                </div>
                            </Button>
                        </Link>

                        <Link to="/reports" search={{ farmId }} className="w-full">
                            <Button variant="outline" className="h-auto p-4 w-full glass text-blue-600">
                                <div className="text-center">
                                    <Building2 className="h-6 w-6 mx-auto mb-2" />
                                    <div className="font-medium">View Reports</div>
                                    <div className="text-xs text-muted-foreground">Generate farm reports</div>
                                </div>
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6 glass">
                <CardHeader>
                    <CardTitle>Farm Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Name</p>
                            <p className="text-sm">{farm.name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Type</p>
                            <p className="text-sm capitalize">{farm.type}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Location</p>
                            <p className="text-sm">{farm.location}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Created</p>
                            <p className="text-sm">{new Date(farm.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
