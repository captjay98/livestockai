import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
    Check,
    DollarSign,
    Edit2,
    Minus,
    TrendingDown,
    TrendingUp,
    Upload,
    X,
} from 'lucide-react'
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { format as formatDate } from 'date-fns'
import { toast } from 'sonner'
import { toNumber } from '~/features/settings/currency'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Skeleton } from '~/components/ui/skeleton'
import { Badge } from '~/components/ui/badge'
import { useFormatCurrency } from '~/features/settings'

export function PriceManager() {
    const { t } = useTranslation(['feed-formulation', 'common'])
    const { format: formatCurrency } = useFormatCurrency()
    const queryClient = useQueryClient()

    const [editingPrice, setEditingPrice] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')

    // Fetch ingredients with current prices
    const { data: ingredients, isLoading } = useQuery({
        queryKey: ['ingredients-with-prices'],
        queryFn: async () => {
            const { getIngredientsWithPricesFn } =
                await import('~/features/feed-formulation/server')
            return getIngredientsWithPricesFn()
        },
    })

    // Fetch price history for selected ingredient
    const [selectedIngredient, setSelectedIngredient] = useState<string | null>(
        null,
    )
    const { data: priceHistory } = useQuery({
        queryKey: ['price-history', selectedIngredient],
        queryFn: async () => {
            if (!selectedIngredient) return null
            const { getPriceHistoryFn } =
                await import('~/features/feed-formulation/server')
            return getPriceHistoryFn({
                data: { ingredientId: selectedIngredient },
            })
        },
        enabled: !!selectedIngredient,
    })

    // Update price mutation
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
            queryClient.invalidateQueries({ queryKey: ['price-history'] })
            setEditingPrice(null)
            setEditValue('')
        },
    })

    // CSV import mutation
    const importCsvMutation = useMutation({
        mutationFn: async (csvContent: string) => {
            const { importIngredientPricesCsvFn } =
                await import('~/features/feed-formulation/server')
            return importIngredientPricesCsvFn({ data: { csvContent } })
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({
                queryKey: ['ingredients-with-prices'],
            })
            if (result.errors > 0) {
                toast.warning(
                    t('priceManager.importPartial', {
                        defaultValue: 'Import Completed with Errors',
                    }),
                    {
                        description: t('priceManager.importPartialDesc', {
                            defaultValue: `Imported ${result.success} prices. ${result.errors} errors occurred.`,
                            success: result.success,
                            errors: result.errors,
                        }),
                    },
                )
            } else {
                toast.success(
                    t('priceManager.importSuccess', {
                        defaultValue: 'Import Successful',
                    }),
                    {
                        description: t('priceManager.importSuccessDesc', {
                            defaultValue: `Successfully imported ${result.success} ingredient prices.`,
                            count: result.success,
                        }),
                    },
                )
            }
        },
        onError: (error) => {
            toast.error(
                t('priceManager.importError', {
                    defaultValue: 'Import Failed',
                }),
                {
                    description:
                        error instanceof Error
                            ? error.message
                            : 'Failed to import CSV',
                },
            )
        },
    })

    const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const text = await file.text()
        importCsvMutation.mutate(text)
        e.target.value = '' // Reset input
    }

    const handleEditStart = (
        ingredientId: string,
        currentPrice: number | null,
    ) => {
        setEditingPrice(ingredientId)
        setEditValue(currentPrice?.toString() || '')
    }

    const handleEditSave = (ingredientId: string) => {
        const price = parseFloat(editValue)
        if (!isNaN(price) && price >= 0) {
            updatePriceMutation.mutate({ ingredientId, pricePerKg: price })
        }
    }

    const handleEditCancel = () => {
        setEditingPrice(null)
        setEditValue('')
    }

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="h-4 w-4 text-red-500" />
            case 'down':
                return <TrendingDown className="h-4 w-4 text-green-500" />
            default:
                return <Minus className="h-4 w-4 text-gray-500" />
        }
    }

    const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return 'text-red-600'
            case 'down':
                return 'text-green-600'
            default:
                return 'text-gray-600'
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        {t('priceManager.title', {
                            defaultValue: 'Price Manager',
                        })}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[400px] w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        {t('priceManager.title', {
                            defaultValue: 'Price Manager',
                        })}
                    </CardTitle>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <label htmlFor="csv-upload">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                disabled={importCsvMutation.isPending}
                            >
                                <span>
                                    <Upload className="h-4 w-4 mr-2" />
                                    {importCsvMutation.isPending
                                        ? t('priceManager.importing', {
                                              defaultValue: 'Importing...',
                                          })
                                        : t('priceManager.importCsv', {
                                              defaultValue: 'Import CSV',
                                          })}
                                </span>
                            </Button>
                        </label>
                        <input
                            id="csv-upload"
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleCsvUpload}
                            disabled={importCsvMutation.isPending}
                        />
                        <span className="text-xs text-muted-foreground">
                            {t('priceManager.csvFormat', {
                                defaultValue:
                                    'Format: ingredient_name,price_per_kg',
                            })}
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Ingredient Price List */}
                    <div className="space-y-4">
                        <h3 className="font-medium">
                            {t('priceManager.currentPrices', {
                                defaultValue: 'Current Prices',
                            })}
                        </h3>
                        <div className="grid gap-3">
                            {ingredients?.map((ingredient) => (
                                <div
                                    key={ingredient.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                    onClick={() =>
                                        setSelectedIngredient(ingredient.id)
                                    }
                                >
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="font-medium">
                                                {ingredient.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground capitalize">
                                                {ingredient.category}
                                            </div>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="ml-2"
                                        >
                                            Max{' '}
                                            {ingredient.maxInclusionPercent ||
                                                100}
                                            %
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Price Input/Display */}
                                        <div className="flex items-center gap-2 min-w-[120px]">
                                            {editingPrice === ingredient.id ? (
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={editValue}
                                                        onChange={(e) =>
                                                            setEditValue(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-20 h-8 text-sm"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'Enter'
                                                            )
                                                                handleEditSave(
                                                                    ingredient.id,
                                                                )
                                                            if (
                                                                e.key ===
                                                                'Escape'
                                                            )
                                                                handleEditCancel()
                                                        }}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleEditSave(
                                                                ingredient.id,
                                                            )
                                                        }}
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleEditCancel()
                                                        }}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {ingredient.pricePerKg
                                                            ? formatCurrency(
                                                                  ingredient.pricePerKg,
                                                              )
                                                            : 'No price'}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleEditStart(
                                                                ingredient.id,
                                                                ingredient.pricePerKg
                                                                    ? toNumber(
                                                                          ingredient.pricePerKg,
                                                                      )
                                                                    : null,
                                                            )
                                                        }}
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Price History Chart */}
            {selectedIngredient && priceHistory && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t('priceManager.priceHistory', {
                                defaultValue: 'Price History',
                            })}{' '}
                            -{' '}
                            {
                                ingredients?.find(
                                    (i) => i.id === selectedIngredient,
                                )?.name
                            }
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={priceHistory as any}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) =>
                                            formatDate(
                                                new Date(value),
                                                'MMM dd',
                                            )
                                        }
                                    />
                                    <YAxis
                                        tickFormatter={(value) =>
                                            formatCurrency(value)
                                        }
                                    />
                                    <Tooltip
                                        labelFormatter={(value) =>
                                            formatDate(
                                                new Date(value),
                                                'MMM dd, yyyy',
                                            )
                                        }
                                        formatter={(value: any) =>
                                            formatCurrency(value)
                                        }
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="pricePerKg"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Mobile Quick Entry */}
            <Card className="md:hidden">
                <CardHeader>
                    <CardTitle>
                        {t('priceManager.quickEntry', {
                            defaultValue: 'Quick Price Entry',
                        })}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {ingredients?.slice(0, 5).map((ingredient) => (
                            <div
                                key={ingredient.id}
                                className="flex items-center gap-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">
                                        {ingredient.name}
                                    </div>
                                </div>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Price"
                                    className="w-24 h-12"
                                    defaultValue={ingredient.pricePerKg?.toString()}
                                    onBlur={(e) => {
                                        const price = parseFloat(e.target.value)
                                        if (!isNaN(price) && price >= 0) {
                                            updatePriceMutation.mutate({
                                                ingredientId: ingredient.id,
                                                pricePerKg: price,
                                            })
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
