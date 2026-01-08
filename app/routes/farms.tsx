import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getFarmsForUser } from '~/lib/farms/server'
import { requireAuth } from '~/lib/auth/middleware'
import { buttonVariants } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Plus, MapPin, Building2 } from 'lucide-react'

interface Farm {
  id: string
  name: string
  location: string
  type: 'poultry' | 'fishery' | 'mixed'
}

const getFarms = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const session = await requireAuth()
      const farms = await getFarmsForUser(session.user.id)
      return { farms }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  })

export const Route = createFileRoute('/farms')({
  component: FarmsPage,
  loader: () => getFarms(),
})

function FarmsPage() {
  const loaderData = Route.useLoaderData()
  const farms = (loaderData?.farms ?? []) as Farm[]

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Farm Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your farms and view their performance
          </p>
        </div>
        <Link to="/farms/new" className={buttonVariants()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Farm
        </Link>
      </div>

      {farms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No farms found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first farm
            </p>
            <Link to="/farms/new" className={buttonVariants()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Farm
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <Card key={farm.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{farm.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {farm.location}
                    </CardDescription>
                  </div>
                  <Badge variant={
                    farm.type === 'poultry' ? 'default' :
                    farm.type === 'fishery' ? 'secondary' : 'outline'
                  }>
                    {farm.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Link to="/farms/$farmId" params={{ farmId: farm.id }} className={buttonVariants({ variant: 'default', size: 'sm', className: 'flex-1' })}>
                      View Details
                  </Link>
                  <Link to="/farms/$farmId/edit" params={{ farmId: farm.id }} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'flex-1' })}>
                      Edit
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Outlet />
    </div>
  )
}