import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'

interface PriceEditorProps {
  ingredients: Array<{
    id: string
    name: string
    category: string
  }>
  prices: Record<string, string>
  onPriceChange: (ingredientId: string, price: string) => void
  userPrices?: Array<{ ingredientId: string; pricePerKg: string }>
  formatCurrency: (amount: number | string) => string
}

export function PriceEditor({
  ingredients,
  prices,
  onPriceChange,
  userPrices,
  formatCurrency,
}: PriceEditorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Ingredient Prices</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ingredients.map((ingredient) => {
          const userPrice = userPrices?.find(
            (p) => p.ingredientId === ingredient.id,
          )?.pricePerKg
          const currentPrice =
            prices[ingredient.id] || userPrice?.toString() || ''

          return (
            <div key={ingredient.id} className="space-y-2">
              <Label htmlFor={`price-${ingredient.id}`}>
                {ingredient.name}
                <span className="text-xs text-muted-foreground ml-2">
                  ({ingredient.category})
                </span>
              </Label>
              <Input
                id={`price-${ingredient.id}`}
                type="number"
                step="0.01"
                value={currentPrice}
                onChange={(e) => onPriceChange(ingredient.id, e.target.value)}
                placeholder={
                  userPrice ? formatCurrency(userPrice) : 'Enter price'
                }
                className="h-12"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
