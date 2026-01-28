import { Link, createFileRoute } from '@tanstack/react-router'
import { MapPin, Users } from 'lucide-react'
import { getUserDistrictsFn } from '~/features/extension/server'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { PageHeader } from '~/components/page-header'

export const Route = createFileRoute('/_auth/extension/')({
    loader: async () => {
        return getUserDistrictsFn()
    },
    component: ExtensionHomePage,
})

function ExtensionHomePage() {
    const districts = Route.useLoaderData()

    return (
        <div className="space-y-6">
            <PageHeader
                title="Extension Worker Dashboard"
                description="Manage your assigned districts and monitor farm health"
                icon={Users}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {districts.map((district) => (
                    <Card key={district.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                {district.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                {district.farmCount} farms assigned
                            </p>
                            <Button asChild className="w-full">
                                <Link
                                    to="/extension/$districtId"
                                    params={{ districtId: district.id }}
                                >
                                    View Dashboard
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
