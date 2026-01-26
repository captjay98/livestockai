import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Calculator, CheckCircle, Play } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { useFormatCurrency } from '~/features/settings'

interface FormulationCalculatorProps {
  onSaveFormulation?: (formulation: any) => void
}

const BATCH_SIZES = [
  { value: '25', label: '25kg' },
  { value: '50', label: '50kg' },
  { value: '100', label: '100kg' },
  { value: '250', label: '250kg' },
  { value: '500', label: '500kg' },
  { value: '1000', label: '1000kg' },
  { value: 'custom', label: 'Custom' },
]

const SAFETY_MARGINS = [
  { value: '0', label: '0%' },
  { value: '2', label: '2%' },
  { value: '5', label: '5%' },
  { value: '10', label: '10%' },
]

const SPECIES_OPTIONS = [
  { value: 'Broiler', label: 'Broiler' },
  { value: 'Layer', label: 'Layer' },
  { value: 'Turkey', label: 'Turkey' },
  { value: 'Catfish', label: 'Catfish' },
  { value: 'Tilapia', label: 'Tilapia' },
  { value: 'Beef Cattle', label: 'Beef Cattle' },
  { value: 'Dairy Cattle', label: 'Dairy Cattle' },
  { value: 'Meat Goat', label: 'Meat Goat' },
  { value: 'Dairy Goat', label: 'Dairy Goat' },
  { value: 'Meat Sheep', label: 'Meat Sheep' },
]

const STAGE_OPTIONS = {
  Broiler: [
    { value: 'starter', label: 'Starter (0-3 weeks)' },
    { value: 'grower', label: 'Grower (3-6 weeks)' },
    { value: 'finisher', label: 'Finisher (6+ weeks)' },
  ],
  Layer: [
    { value: 'starter', label: 'Starter (0-6 weeks)' },
    { value: 'grower', label: 'Grower (6-18 weeks)' },
    { value: 'layer', label: 'Layer (18+ weeks)' },
  ],
  Turkey: [
    { value: 'starter', label: 'Starter (0-4 weeks)' },
    { value: 'grower', label: 'Grower (4-12 weeks)' },
    { value: 'finisher', label: 'Finisher (12+ weeks)' },
  ],
  Catfish: [
    { value: 'starter', label: 'Starter (0-8 weeks)' },
    { value: 'grower', label: 'Grower (8-16 weeks)' },
    { value: 'finisher', label: 'Finisher (16+ weeks)' },
  ],
  Tilapia: [
    { value: 'starter', label: 'Starter (0-6 weeks)' },
    { value: 'grower', label: 'Grower (6-12 weeks)' },
    { value: 'finisher', label: 'Finisher (12+ weeks)' },
  ],
  'Beef Cattle': [
    { value: 'calf', label: 'Calf' },
    { value: 'growing', label: 'Growing' },
    { value: 'finishing', label: 'Finishing' },
  ],
  'Dairy Cattle': [
    { value: 'calf', label: 'Calf' },
    { value: 'heifer', label: 'Heifer' },
    { value: 'lactating', label: 'Lactating' },
    { value: 'dry', label: 'Dry' },
  ],
  'Meat Goat': [
    { value: 'kid', label: 'Kid' },
    { value: 'growing', label: 'Growing' },
    { value: 'finishing', label: 'Finishing' },
  ],
  'Dairy Goat': [
    { value: 'kid', label: 'Kid' },
    { value: 'growing', label: 'Growing' },
    { value: 'lactating', label: 'Lactating' },
  ],
  'Meat Sheep': [
    { value: 'lamb', label: 'Lamb' },
    { value: 'growing', label: 'Growing' },
    { value: 'finishing', label: 'Finishing' },
  ],
}

export function FormulationCalculator({
  onSaveFormulation,
}: FormulationCalculatorProps) {
  const { t } = useTranslation(['feed-formulation', 'common'])
  const { format } = useFormatCurrency()
  const queryClient = useQueryClient()

  const [species, setSpecies] = useState('')
  const [stage, setStage] = useState('')
  const [batchSize, setBatchSize] = useState('100')
  const [customBatchSize, setCustomBatchSize] = useState('')
  const [safetyMargin, setSafetyMargin] = useState('2')
  const [mixingInstructions, setMixingInstructions] = useState('')
  const [ingredientPrices, setIngredientPrices] = useState<
    Record<string, string>
  >({})

  // Fetch available ingredients
  const { data: ingredients, isLoading: loadingIngredients } = useQuery({
    queryKey: ['feed-ingredients'],
    queryFn: async () => {
      const { getFeedIngredientsFn } =
        await import('~/features/feed-formulation/server')
      return getFeedIngredientsFn()
    },
  })

  // Fetch user's ingredient prices
  const { data: userPrices } = useQuery({
    queryKey: ['user-ingredient-prices'],
    queryFn: async () => {
      const { getUserIngredientPricesFn } =
        await import('~/features/feed-formulation/server')
      return getUserIngredientPricesFn()
    },
  })

  // Run optimization mutation
  const optimizeMutation = useMutation({
    mutationFn: async (data: any) => {
      const { runOptimizationFn } =
        await import('~/features/feed-formulation/server')
      return runOptimizationFn({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formulation-results'] })
    },
  })

  const handlePriceChange = (ingredientId: string, price: string) => {
    setIngredientPrices((prev) => ({ ...prev, [ingredientId]: price }))
  }

  const handleOptimize = () => {
    if (!species || !stage) return

    const actualBatchSize =
      batchSize === 'custom'
        ? parseFloat(customBatchSize)
        : parseFloat(batchSize)

    optimizeMutation.mutate({
      species,
      stage,
      batchSize: actualBatchSize,
      safetyMargin: parseFloat(safetyMargin),
      ingredientPrices,
    })
  }

  const result = optimizeMutation.data
  const isOptimizing = optimizeMutation.isPending

  if (loadingIngredients) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t('calculator.title', {
              defaultValue: 'Feed Formulation Calculator',
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
            <Calculator className="h-5 w-5" />
            {t('calculator.title', {
              defaultValue: 'Feed Formulation Calculator',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Species and Stage Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                {t('calculator.species', { defaultValue: 'Species' })}
              </Label>
              <Select
                value={species}
                onValueChange={(v) => setSpecies(v || '')}
              >
                <SelectTrigger className="h-12">
                  <SelectValue
                    placeholder={t('calculator.selectSpecies', {
                      defaultValue: 'Select species',
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {SPECIES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {t('calculator.stage', { defaultValue: 'Production Stage' })}
              </Label>
              <Select
                value={stage}
                onValueChange={(v) => setStage(v || '')}
                disabled={!species}
              >
                <SelectTrigger className="h-12">
                  <SelectValue
                    placeholder={t('calculator.selectStage', {
                      defaultValue: 'Select stage',
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {species &&
                    STAGE_OPTIONS[species as keyof typeof STAGE_OPTIONS].map(
                      (option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ),
                    )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Batch Size and Safety Margin */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>
                {t('calculator.batchSizeKg', { defaultValue: 'Batch Size' })}
              </Label>
              <Select
                value={batchSize}
                onValueChange={(v) => setBatchSize(v || '100')}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BATCH_SIZES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {batchSize === 'custom' && (
              <div className="space-y-2">
                <Label>
                  {t('calculator.customSize', {
                    defaultValue: 'Custom Size (kg)',
                  })}
                </Label>
                <Input
                  type="number"
                  value={customBatchSize}
                  onChange={(e) => setCustomBatchSize(e.target.value)}
                  placeholder="Enter size"
                  className="h-12"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>
                {t('calculator.safetyMargin', {
                  defaultValue: 'Safety Margin',
                })}
              </Label>
              <Select
                value={safetyMargin}
                onValueChange={(v) => setSafetyMargin(v || '2')}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SAFETY_MARGINS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mixing Instructions */}
          <div className="space-y-2">
            <Label htmlFor="mixing-instructions">
              {t('calculator.mixingInstructions', {
                defaultValue: 'Mixing Instructions (Optional)',
              })}
            </Label>
            <Textarea
              id="mixing-instructions"
              value={mixingInstructions}
              onChange={(e) => setMixingInstructions(e.target.value)}
              placeholder={t('calculator.mixingInstructionsPlaceholder', {
                defaultValue:
                  '1. Mix all dry ingredients thoroughly\n2. Add oil and mix for 5 minutes\n3. Store in cool, dry place\n4. Use within 30 days',
              })}
              className="min-h-[100px]"
              maxLength={1000}
            />
            <p className="text-sm text-muted-foreground">
              {mixingInstructions.length}/1000 characters
            </p>
          </div>

          {/* Ingredient Prices */}
          {ingredients && ingredients.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {t('calculator.ingredientPrices', {
                  defaultValue: 'Ingredient Prices',
                })}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ingredients.map((ingredient: any) => {
                  const userPrice = userPrices?.find(
                    (p: any) => p.ingredientId === ingredient.id,
                  )?.pricePerKg
                  const currentPrice =
                    ingredientPrices[ingredient.id] ||
                    userPrice?.toString() ||
                    ''

                  return (
                    <div key={ingredient.id} className="space-y-2">
                      <Label className="text-sm">{ingredient.name}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={currentPrice}
                        onChange={(e) =>
                          handlePriceChange(ingredient.id, e.target.value)
                        }
                        placeholder="Price per kg"
                        className="h-12"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Optimize Button */}
          <Button
            onClick={handleOptimize}
            disabled={!species || !stage || isOptimizing}
            className="w-full h-12"
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            {isOptimizing
              ? t('calculator.optimizing', { defaultValue: 'Optimizing...' })
              : t('calculator.runOptimization', {
                  defaultValue: 'Run Optimization',
                })}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.feasible ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              {result.feasible
                ? t('results.optimal', { defaultValue: 'Optimal Formulation' })
                : t('results.infeasible', {
                    defaultValue: 'Infeasible Solution',
                  })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.feasible ? (
              <div className="space-y-6">
                {/* Cost Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {format(result.totalCostPerKg)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Cost per kg
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {format(
                        parseFloat(batchSize || '100') * result.totalCostPerKg,
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total batch cost
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {batchSize === 'custom' ? customBatchSize : batchSize}kg
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Batch size
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {result.ingredients.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ingredients
                    </div>
                  </div>
                </div>

                {/* Ingredient Breakdown */}
                <div>
                  <h4 className="font-medium mb-3">
                    {t('results.ingredients', {
                      defaultValue: 'Ingredient Breakdown',
                    })}
                  </h4>
                  <div className="space-y-2">
                    {result.ingredients.map((ing: any) => (
                      <div
                        key={ing.ingredientId}
                        className="flex justify-between items-center p-3 bg-muted rounded-lg"
                      >
                        <span className="font-medium">{ing.name}</span>
                        <div className="text-right">
                          <div className="font-medium">
                            {ing.quantity.toFixed(2)}kg (
                            {ing.percentage.toFixed(1)}%)
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(ing.cost)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nutritional Analysis */}
                <div>
                  <h4 className="font-medium mb-3">
                    {t('results.nutritionalValues', {
                      defaultValue: 'Nutritional Analysis',
                    })}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-lg font-bold">
                        {result.nutritionalValues.protein.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Protein
                      </div>
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

                {/* Save Button */}
                {onSaveFormulation && (
                  <Button
                    onClick={() =>
                      onSaveFormulation({ ...result, mixingInstructions })
                    }
                    variant="outline"
                    className="w-full h-12"
                  >
                    {t('results.save', { defaultValue: 'Save Formulation' })}
                  </Button>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {result.infeasibilityReport ||
                    t('results.infeasibleMessage', {
                      defaultValue:
                        'No feasible solution found with current constraints and ingredient prices.',
                    })}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
