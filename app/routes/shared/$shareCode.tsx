import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { useFormatCurrency } from '~/features/settings'
import { toNumber } from '~/features/settings/currency'

export const Route = createFileRoute('/shared/$shareCode')({
    loader: async ({ params }) => {
        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const formulation = await db
            .selectFrom('saved_formulations')
            .selectAll()
            .where('shareCode', '=', params.shareCode)
            .executeTakeFirst()

        if (!formulation) {
            throw new Error('Formulation not found')
        }

        return formulation
    },
    component: SharedFormulationPage,
})

function SharedFormulationPage() {
    const formulation = Route.useLoaderData()
    const { format } = useFormatCurrency()

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle>{formulation.name}</CardTitle>
                    <div className="flex gap-2 mt-2">
                        <Badge>{formulation.species}</Badge>
                        <Badge variant="outline">
                            {formulation.productionStage}
                        </Badge>
                        <Badge variant="secondary">
                            {formulation.batchSizeKg}kg batch
                        </Badge>
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
                                Cost per kg
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
                                Total cost
                            </div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">
                                {formulation.ingredients.length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Ingredients
                            </div>
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div>
                        <h4 className="font-medium mb-3">Ingredients</h4>
                        <div className="space-y-2">
                            {formulation.ingredients.map(
                                (ing: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="flex justify-between items-center p-3 bg-muted rounded-lg"
                                    >
                                        <span className="font-medium">
                                            Ingredient {idx + 1}
                                        </span>
                                        <div className="text-right">
                                            <div className="font-medium">
                                                {ing.percentage.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>

                    {/* Nutritional Profile */}
                    <div>
                        <h4 className="font-medium mb-3">
                            Nutritional Profile
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <div className="text-lg font-bold">
                                    {formulation.nutritionalValues.protein.toFixed(
                                        1,
                                    )}
                                    %
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Protein
                                </div>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <div className="text-lg font-bold">
                                    {formulation.nutritionalValues.energy.toFixed(
                                        0,
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Energy (kcal/kg)
                                </div>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <div className="text-lg font-bold">
                                    {formulation.nutritionalValues.fiber.toFixed(
                                        1,
                                    )}
                                    %
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Fiber
                                </div>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <div className="text-lg font-bold">
                                    {formulation.nutritionalValues.fat.toFixed(
                                        1,
                                    )}
                                    %
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Fat
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mixing Instructions */}
                    {formulation.mixingInstructions && (
                        <div>
                            <h4 className="font-medium mb-3">
                                Mixing Instructions
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
