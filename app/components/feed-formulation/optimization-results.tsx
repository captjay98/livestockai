import { CheckCircle } from 'lucide-react'

interface OptimizationResultsProps {
  result: {
    totalCostPerKg: number
    ingredients: Array<{
      ingredientId: string
      name: string
      percentage: number
      quantity: number
      cost: number
    }>
    nutritionalValues: {
      protein: number
      energy: number
      fat: number
      fiber: number
    }
  }
  batchSize: string
  formatCurrency: (amount: number) => string
}

export function OptimizationResults({
  result,
  batchSize,
  formatCurrency,
}: OptimizationResultsProps) {
  return (
    <div className="space-y-6">
      {/* Cost Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">
            {formatCurrency(result.totalCostPerKg)}
          </div>
          <div className="text-sm text-muted-foreground">Cost per kg</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">
            {formatCurrency(
              parseFloat(batchSize || '100') * result.totalCostPerKg,
            )}
          </div>
          <div className="text-sm text-muted-foreground">Total batch cost</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{batchSize || '100'}kg</div>
          <div className="text-sm text-muted-foreground">Batch size</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{result.ingredients.length}</div>
          <div className="text-sm text-muted-foreground">Ingredients</div>
        </div>
      </div>

      {/* Ingredient Breakdown */}
      <div>
        <h4 className="font-medium mb-3">Ingredient Breakdown</h4>
        <div className="space-y-2">
          {result.ingredients.map((ing) => (
            <div
              key={ing.ingredientId}
              className="flex justify-between items-center p-3 bg-muted rounded-lg"
            >
              <span className="font-medium">{ing.name}</span>
              <div className="text-right">
                <div className="font-medium">
                  {ing.quantity.toFixed(2)}kg ({ing.percentage.toFixed(1)}%)
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(ing.cost)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nutritional Analysis */}
      <div>
        <h4 className="font-medium mb-3">Nutritional Analysis</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold">
              {result.nutritionalValues.protein.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Protein</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold">
              {result.nutritionalValues.energy.toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground">
              Energy (kcal/kg)
            </div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold">
              {result.nutritionalValues.fiber.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Fiber</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold">
              {result.nutritionalValues.fat.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Fat</div>
          </div>
        </div>
      </div>
    </div>
  )
}
