import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Shield, TrendingUp, Users } from 'lucide-react'
import { getSupervisorDashboardFn } from '~/features/extension/server'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/_auth/extension/supervisor')({
  loader: async () => {
    return getSupervisorDashboardFn({ data: undefined })
  },
  component: SupervisorDashboard,
})

function SupervisorDashboard() {
  const { districts, totalDistricts } = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Supervisor Dashboard</h1>
          <p className="text-muted-foreground">
            Managing {totalDistricts} district
            {totalDistricts !== (1 as number) ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {districts.map((district: any) => (
          <Card key={district.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{district.name}</CardTitle>
                {district.outbreakCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="flex items-center gap-1"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {district.outbreakCount} Alert
                    {district.outbreakCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {district.lga}, {district.state}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">{district.farmCount}</p>
                    <p className="text-xs text-muted-foreground">Farms</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">
                      {district.livestockCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Livestock</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-medium">Health Status</p>
                </div>

                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-200"
                  >
                    {district.healthStats.healthy} Healthy
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-yellow-600 border-yellow-200"
                  >
                    {district.healthStats.warning} Warning
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-red-600 border-red-200"
                  >
                    {district.healthStats.critical} Critical
                  </Badge>
                </div>
              </div>

              <Button asChild variant="outline" className="w-full">
                <Link
                  to="/extension/district/$districtId"
                  params={{ districtId: district.id }}
                >
                  View District Details
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {districts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Districts Assigned
            </h3>
            <p className="text-muted-foreground text-center">
              You are not currently assigned as a supervisor for any districts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
