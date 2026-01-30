import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { useFormatCurrency } from '~/features/settings'
import { toNumber } from '~/features/settings/currency'
import { Skeleton } from '~/components/ui/skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/shared/$shareCode')({
  loader: async ({ params }) => {
    // Rate limiting for public route
    // Note: Request object isn't directly available in TanStack loader context here
    // In a real environment, we'd use a platform-specific way to get the IP
    const { checkRateLimit } = await import('~/lib/rate-limit')
    const ip = 'public-visitor' as any // Fallback for type safety

    const { allowed } = checkRateLimit(ip)
    if (!allowed) {
      throw new Response('Rate limit exceeded', { status: 429 })
    }

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    const formulation = await db
      .selectFrom('saved_formulations')
      .select([
        'id',
        'userId',
        'name',
        'species',
        'productionStage',
        'batchSizeKg',
        'ingredients',
        'totalCostPerKg',
        'nutritionalValues',
        'mixingInstructions',
        'shareCode',
        'createdAt',
        'updatedAt',
      ])
      .where('shareCode', '=', params.shareCode)
      .executeTakeFirst()

    if (!formulation) {
      throw new Error('Formulation not found')
    }

    return formulation
  },
  component: SharedFormulationPage,
  pendingComponent: () => <Skeleton className="h-96 w-full" />,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
})

function SharedFormulationPage() {
  const { t } = useTranslation(['feedFormulation'])
  const formulation = Route.useLoaderData()
  const { format } = useFormatCurrency()

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{formulation.name}</CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge>{formulation.species}</Badge>
            <Badge variant="outline">{formulation.productionStage}</Badge>
            <Badge variant="secondary">{formulation.batchSizeKg}kg batch</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cost Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {format(formulation.totalCostPerKg)}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('feedFormulation:costPerKg', {
                  defaultValue: 'Cost per kg',
                })}
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {format(
                  toNumber(formulation.totalCostPerKg) *
                    toNumber(formulation.batchSizeKg),
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('feedFormulation:totalBatchCost', {
                  defaultValue: 'Total cost',
                })}
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {formulation.ingredients.length}
              </div>
              <div className="text-sm text-muted-foreground">Ingredients</div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h4 className="font-medium mb-3">Ingredients</h4>
            <div className="space-y-2">
              {formulation.ingredients.map((ing: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-muted rounded-lg"
                >
                  <span className="font-medium">Ingredient {idx + 1}</span>
                  <div className="text-right">
                    <div className="font-medium">
                      {ing.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nutritional Profile */}
          <div>
            <h4 className="font-medium mb-3">
              {t('feedFormulation:nutritionalProfile', {
                defaultValue: 'Nutritional Profile',
              })}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-bold">
                  {formulation.nutritionalValues.protein.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Protein</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-bold">
                  {formulation.nutritionalValues.energy.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Energy (kcal/kg)
                </div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-bold">
                  {formulation.nutritionalValues.fiber.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Fiber</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-bold">
                  {formulation.nutritionalValues.fat.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Fat</div>
              </div>
            </div>
          </div>

          {/* Mixing Instructions */}
          {formulation.mixingInstructions && (
            <div>
              <h4 className="font-medium mb-3">
                {t('feedFormulation:mixingInstructions', {
                  defaultValue: 'Mixing Instructions',
                })}
              </h4>
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                {formulation.mixingInstructions}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
