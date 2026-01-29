import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BarChart3, Crown, Download, Share2, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { useFormatCurrency } from '~/features/settings'

interface FormulationComparisonProps {
  selectedFormulations?: Array<string>
  onSelectionChange?: (formulations: Array<string>) => void
}

export function FormulationComparison({
  selectedFormulations = [],
  onSelectionChange,
}: FormulationComparisonProps) {
  const { t } = useTranslation(['feed-formulation', 'common'])
  const { format } = useFormatCurrency()

  const [localSelection, setLocalSelection] =
    useState<Array<string>>(selectedFormulations)

  // Fetch saved formulations for selection
  const { data: formulations, isLoading } = useQuery({
    queryKey: ['saved-formulations'],
    queryFn: async () => {
      const { getFormulationsFn } =
        await import('~/features/feed-formulation/server')
      return getFormulationsFn()
    },
  })

  // Fetch comparison data for selected formulations
  const { data: comparisonData } = useQuery({
    queryKey: ['formulation-comparison', localSelection],
    queryFn: async () => {
      if (localSelection.length < 2) return null
      const { compareFormulationsFn } =
        await import('~/features/feed-formulation/server')
      return compareFormulationsFn({
        data: { formulationIds: localSelection },
      })
    },
    enabled: localSelection.length >= 2,
  })

  const handleSelectionChange = (formulationId: string, checked: boolean) => {
    const newSelection = checked
      ? [...localSelection, formulationId].slice(0, 3) // Max 3 formulations
      : localSelection.filter((id) => id !== formulationId)

    setLocalSelection(newSelection)
    onSelectionChange?.(newSelection)
  }

  const handleExportPdf = async () => {
    if (!comparisonData) return

    const { exportComparisonPdfFn } =
      await import('~/features/feed-formulation/server')
    const pdfBlob = await exportComparisonPdfFn({
      data: { comparisonData: comparisonData },
    })

    // Create download link
    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `formulation-comparison-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    if (!comparisonData) return

    const { generateShareCodeFn } =
      await import('~/features/feed-formulation/server')
    const result = await generateShareCodeFn({
      data: { formulationId: localSelection[0] },
    })

    // Copy to clipboard
    await navigator.clipboard.writeText(result.shareCode)
    // Could show toast notification here
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('comparison.title', {
              defaultValue: 'Formulation Comparison',
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
            <BarChart3 className="h-5 w-5" />
            {t('comparison.title', {
              defaultValue: 'Formulation Comparison',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Formulation Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">
              {t('comparison.selectFormulations', {
                defaultValue: 'Select Formulations to Compare',
              })}
              <span className="text-sm text-muted-foreground ml-2">
                (Max 3)
              </span>
            </h3>

            <div className="grid gap-3">
              {formulations?.map((formulation) => (
                <div
                  key={formulation.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <Checkbox
                    checked={localSelection.includes(formulation.id)}
                    onCheckedChange={(checked) =>
                      handleSelectionChange(formulation.id, checked as boolean)
                    }
                    disabled={
                      !localSelection.includes(formulation.id) &&
                      localSelection.length >= 3
                    }
                  />
                  <div className="flex-1">
                    <div className="font-medium">{formulation.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formulation.species} • {formulation.productionStage} •{' '}
                      {format(formulation.totalCostPerKg)}
                      /kg
                    </div>
                  </div>
                  <Badge variant="outline">{formulation.batchSizeKg}kg</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparisonData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {t('comparison.results', {
                  defaultValue: 'Comparison Results',
                })}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('comparison.share', {
                    defaultValue: 'Share',
                  })}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('comparison.exportPdf', {
                    defaultValue: 'Export PDF',
                  })}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Cost Comparison */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  {t('comparison.costComparison', {
                    defaultValue: 'Cost Comparison',
                  })}
                  <TrendingDown className="h-4 w-4 text-green-600" />
                </h4>
                <div className="grid gap-4">
                  {comparisonData.map((formulation: any) => (
                    <div
                      key={formulation.id}
                      className={`p-4 rounded-lg border-2 ${
                        formulation.isMostCostEffective
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formulation.name}
                          </span>
                          {formulation.isMostCostEffective && (
                            <Badge className="bg-green-600">
                              <Crown className="h-3 w-3 mr-1" />
                              {t('comparison.mostCostEffective', {
                                defaultValue: 'Most Cost-Effective',
                              })}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {format(formulation.totalCostPerKg)}
                            /kg
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(formulation.totalCost)} total
                          </div>
                        </div>
                      </div>

                      {formulation.costDifference && (
                        <div className="mt-2 text-sm">
                          <span
                            className={
                              formulation.costDifference > 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }
                          >
                            {formulation.costDifference > 0 ? '+' : ''}
                            {format(formulation.costDifference)}(
                            {formulation.costDifferencePercent > 0 ? '+' : ''}
                            {formulation.costDifferencePercent.toFixed(1)}
                            %) vs most cost-effective
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutritional Comparison */}
              <div>
                <h4 className="font-medium mb-3">
                  {t('comparison.nutritionalComparison', {
                    defaultValue: 'Nutritional Comparison',
                  })}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">
                          {t('comparison.nutrient', {
                            defaultValue: 'Nutrient',
                          })}
                        </th>
                        {comparisonData.map((f: any) => (
                          <th key={f.id} className="text-center p-2">
                            {f.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'protein',
                        'energy',
                        'fiber',
                        'fat',
                        'calcium',
                        'phosphorus',
                      ].map((nutrient) => (
                        <tr key={nutrient} className="border-b">
                          <td className="p-2 font-medium capitalize">
                            {nutrient}
                          </td>
                          {comparisonData.map((f: any) => (
                            <td key={f.id} className="text-center p-2">
                              {f.nutrition[nutrient]?.toFixed(1)}
                              {nutrient === 'energy' ? ' kcal/kg' : '%'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ingredient Differences */}
              <div>
                <h4 className="font-medium mb-3">
                  {t('comparison.ingredientDifferences', {
                    defaultValue: 'Key Ingredient Differences',
                  })}
                </h4>
                <div className="space-y-3">
                  {[].map((diff: any) => (
                    <div
                      key={diff.ingredientName}
                      className="p-3 bg-muted rounded-lg"
                    >
                      <div className="font-medium mb-2">
                        {diff.ingredientName}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        {diff.formulations.map((f: any) => (
                          <div
                            key={f.formulationId}
                            className="flex justify-between"
                          >
                            <span>{f.formulationName}:</span>
                            <span className="font-medium">
                              {f.percentage.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {localSelection.length < 2 && (
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {t('comparison.selectAtLeastTwo', {
                defaultValue: 'Select at least 2 formulations to compare',
              })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
