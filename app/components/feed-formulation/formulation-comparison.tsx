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

interface Formulation {
  id: string
  name: string
  species: string
  productionStage: string
  batchSizeKg: string
  totalCostPerKg: string
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
  const { data: formulations, isLoading } = useQuery<Array<Formulation>>({
    queryKey: ['saved-formulations'],
    queryFn: async () => {
      const { getFormulationsFn } =
        await import('~/features/feed-formulation/server')
      return (getFormulationsFn as any)()
    },
  })

  // Fetch comparison data for selected formulations
  const { data: comparisonData } = useQuery<Array<Formulation> | null>({
    queryKey: ['formulation-comparison', localSelection],
    queryFn: async () => {
      if (localSelection.length < 2) return null
      const { compareFormulationsFn } =
        await import('~/features/feed-formulation/server')
      return (compareFormulationsFn as any)({ data: { formulationIds: localSelection } })
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

    try {
      const { exportComparisonPdfFn } =
        await import('~/features/feed-formulation/server')
      await (exportComparisonPdfFn as any)({ data: { comparisonData } })
    } catch (error) {
      console.error('Failed to export PDF:', error)
    }
  }

  const handleShare = async () => {
    if (!comparisonData || comparisonData.length === 0) return

    try {
      const { generateShareCodeFn } =
        await import('~/features/feed-formulation/server')
      const result = await (generateShareCodeFn as any)({ data: { formulationId: comparisonData[0].id } })

      // Copy to clipboard
      await navigator.clipboard.writeText(result.shareCode)
      // Could show toast notification here
    } catch (error) {
      console.error('Failed to share:', error)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('comparison.title', { defaultValue: 'Formulation Comparison' })}
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
            {t('comparison.title', { defaultValue: 'Formulation Comparison' })}
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
                      handleSelectionChange(formulation.id, Boolean(checked))
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
                      {format(parseFloat(formulation.totalCostPerKg))}/kg
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
                  {t('comparison.share', { defaultValue: 'Share' })}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('comparison.exportPdf', { defaultValue: 'Export PDF' })}
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
                  {comparisonData.map((formulation: Formulation) => {
                    const costPerKg = parseFloat(formulation.totalCostPerKg)
                    const batchSize = parseFloat(formulation.batchSizeKg)
                    const totalCost = costPerKg * batchSize
                    const minCost = Math.min(...comparisonData.map(f => parseFloat(f.totalCostPerKg)))
                    const isMostCostEffective = costPerKg === minCost
                    const costDifference = costPerKg - minCost
                    const costDifferencePercent = minCost > 0 ? (costDifference / minCost) * 100 : 0

                    return (
                      <div
                        key={formulation.id}
                        className={`p-4 rounded-lg border-2 ${
                          isMostCostEffective
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {formulation.name}
                            </span>
                            {isMostCostEffective && (
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
                              {format(costPerKg)}/kg
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(totalCost)} total
                            </div>
                          </div>
                        </div>

                        {costDifference > 0 && (
                          <div className="mt-2 text-sm">
                            <span className="text-red-600">
                              +{format(costDifference)} (+{costDifferencePercent.toFixed(1)}%) vs
                              most cost-effective
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h4 className="font-medium mb-3">
                  {t('comparison.basicInformation', {
                    defaultValue: 'Basic Information',
                  })}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">
                          {t('comparison.formulation', {
                            defaultValue: 'Formulation',
                          })}
                        </th>
                        <th className="text-center p-2">
                          {t('comparison.species', {
                            defaultValue: 'Species',
                          })}
                        </th>
                        <th className="text-center p-2">
                          {t('comparison.stage', {
                            defaultValue: 'Stage',
                          })}
                        </th>
                        <th className="text-center p-2">
                          {t('comparison.batchSize', {
                            defaultValue: 'Batch Size',
                          })}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((f: Formulation) => (
                        <tr key={f.id} className="border-b">
                          <td className="p-2 font-medium">{f.name}</td>
                          <td className="text-center p-2">{f.species}</td>
                          <td className="text-center p-2">{f.productionStage}</td>
                          <td className="text-center p-2">{f.batchSizeKg}kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Note about detailed nutritional comparison */}
              <div>
                <h4 className="font-medium mb-3">
                  {t('comparison.nutritionalComparison', {
                    defaultValue: 'Nutritional Comparison',
                  })}
                </h4>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {t('comparison.nutritionalDataPlaceholder', {
                      defaultValue: 'Detailed nutritional comparison will be available when formulations include nutritional data.',
                    })}
                  </p>
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
