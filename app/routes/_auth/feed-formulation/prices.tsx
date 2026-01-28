import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'
import { useFormatCurrency } from '~/features/settings'

export const Route = createFileRoute('/_auth/feed-formulation/prices')({
    loader: async () => {
        const { getIngredientsWithPricesFn } =
            await import('~/features/feed-formulation/server')
        return getIngredientsWithPricesFn()
    },
    component: PricesPage,
})

function PricesPage() {
    const ingredients = Route.useLoaderData()
    const { format } = useFormatCurrency()
    const queryClient = useQueryClient()
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [prices, setPrices] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState<Record<string, boolean>>({})

    const categories = [
        'all',
        ...Array.from(new Set(ingredients.map((i) => i.category))),
    ]
    const filteredIngredients =
        selectedCategory === 'all'
            ? ingredients
            : ingredients.filter((i) => i.category === selectedCategory)

    const updatePriceMutation = useMutation({
        mutationFn: async (data: {
            ingredientId: string
            pricePerKg: number
        }) => {
            const { updateIngredientPriceFn } =
                await import('~/features/feed-formulation/server')
            return updateIngredientPriceFn({ data })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['ingredients-with-prices'],
            })
        },
    })

    const handleSave = async (ingredientId: string) => {
        const price = prices[ingredientId]
        if (!price) return

        setSaving({ ...saving, [ingredientId]: true })
        try {
            await updatePriceMutation.mutateAsync({
                ingredientId,
                pricePerKg: parseFloat(price),
            })
        } finally {
            setSaving({ ...saving, [ingredientId]: false })
        }
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Quick Price Entry
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Category:</label>
                        <Select
                            value={selectedCategory}
                            onValueChange={(value) =>
                                setSelectedCategory(value || 'all')
                            }
                        >
                            <SelectTrigger className="h-12 w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat === 'all' ? 'All Categories' : cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ingredient List */}
                    <div className="space-y-3">
                        {filteredIngredients.map((ingredient) => (
                            <div
                                key={ingredient.id}
                                className="flex items-center gap-3 p-4 bg-muted rounded-lg"
                            >
                                <div className="flex-1">
                                    <div className="font-medium">
                                        {ingredient.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {ingredient.category} •{' '}
                                        {ingredient.lastUpdated
                                            ? new Date(
                                                  ingredient.lastUpdated,
                                              ).toLocaleDateString()
                                            : 'Never updated'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder={
                                            ingredient.userPrice
                                                ? format(
                                                      ingredient.userPrice
                                                          .pricePerKg,
                                                  )
                                                : 'Enter price'
                                        }
                                        value={prices[ingredient.id] || ''}
                                        onChange={(e) =>
                                            setPrices({
                                                ...prices,
                                                [ingredient.id]: e.target.value,
                                            })
                                        }
                                        className="h-12 w-32 text-lg"
                                    />
                                    <Button
                                        onClick={() =>
                                            handleSave(ingredient.id)
                                        }
                                        disabled={
                                            !prices[ingredient.id] ||
                                            saving[ingredient.id]
                                        }
                                        className="h-12 min-w-[80px]"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving[ingredient.id]
                                            ? 'Saving...'
                                            : 'Save'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
