import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { PageHeader } from '~/components/page-header'
import { Progress } from '~/components/ui/progress'
import { generateCSVReportFn } from '~/features/credit-passport/server'
import { getBatchesFn } from '~/features/batches/server'
import { CreditPassportSkeleton } from '~/components/credit-passport/credit-passport-skeleton'
import { ErrorPage } from '~/components/error-page'

const creditPassportSearchSchema = z.object({
  farmId: z.string().uuid().optional(),
})

export const Route = createFileRoute('/_auth/credit-passport/')({
  validateSearch: creditPassportSearchSchema,
  loaderDeps: ({ search }) => ({
    farmId: search.farmId,
  }),
  loader: async ({ deps }) => {
    if (!deps.farmId) {
      return { batches: [] }
    }
    const batches = await getBatchesFn({ data: { farmId: deps.farmId } })
    return { batches }
  },
  pendingComponent: CreditPassportSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
  ),
  component: CreditPassportWizard,
})

const REPORT_TYPES = [
  {
    value: 'credit_assessment',
    label: 'Credit Assessment',
    description: 'Comprehensive creditworthiness evaluation',
  },
  {
    value: 'production_certificate',
    label: 'Production Certificate',
    description: 'Verified production capacity and history',
  },
  {
    value: 'impact_report',
    label: 'Impact Report',
    description: 'Environmental and social impact metrics',
  },
]

const DATE_PRESETS = [
  { value: '30', label: '30 Days' },
  { value: '60', label: '60 Days' },
  { value: '90', label: '90 Days' },
  { value: 'custom', label: 'Custom Range' },
]

interface Batch {
  id: string
  batchName: string | null
  species: string
  initialQuantity: number
}

function CreditPassportWizard() {
  const { t } = useTranslation(['credit-passport', 'common'])
  const { farmId } = Route.useSearch()
  const { batches } = Route.useLoaderData()

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    reportType: '',
    dateRange: '90',
    startDate: '',
    endDate: '',
    selectedBatches: [] as Array<string>,
    notes: '',
  })

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (!farmId) {
      toast.error(
        t('common:selectFarmFirst', {
          defaultValue: 'Please select a farm first',
        }),
      )
      return
    }

    setIsSubmitting(true)
    try {
      // Calculate date range
      let startDate: Date
      let endDate: Date = new Date()

      if (formData.dateRange === 'custom') {
        startDate = new Date(formData.startDate)
        endDate = new Date(formData.endDate)
      } else {
        const days = parseInt(formData.dateRange)
        startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
      }

      const result = await generateCSVReportFn({
        data: {
          farmIds: [farmId],
          reportType: formData.reportType as
            | 'credit_assessment'
            | 'production_certificate'
            | 'impact_report',
          startDate,
          endDate,
          batchIds: formData.selectedBatches,
          customNotes: formData.notes || undefined,
        },
      })

      // Download CSV file
      const blob = new Blob([result.csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success(
        t('credit-passport:messages.csvDownloaded', {
          defaultValue: 'CSV report downloaded successfully',
        }),
      )

      // Reset form
      setFormData({
        reportType: '',
        dateRange: '90',
        startDate: '',
        endDate: '',
        selectedBatches: [],
        notes: '',
      })
      setCurrentStep(1)
    } catch (error) {
      console.error('Report generation error:', error)
      toast.error(
        t('credit-passport:messages.generationFailed', {
          defaultValue: 'Failed to generate report',
        }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.reportType
      case 2:
        return formData.dateRange === 'custom'
          ? formData.startDate && formData.endDate
          : formData.dateRange
      case 3:
        return formData.selectedBatches.length > 0
      case 4:
        return true // Notes optional
      case 5:
        return true // Preview
      default:
        return false
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('credit-passport:title', { defaultValue: 'Credit Passport' })}
        description={t('credit-passport:description', {
          defaultValue:
            'Generate verified reports for financial institutions and partners',
        })}
        icon={FileText}
      />

      {/* Feature Notice - CSV Export Available */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              CSV Export Available
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Generate comprehensive credit reports in CSV format. Perfect for
              sharing with financial institutions, importing into spreadsheets,
              or further analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Wizard UI */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Step {currentStep} of {totalSteps}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {t('credit-passport:steps.selectReportType', {
                  defaultValue: 'Select Report Type',
                })}
              </h3>
              <RadioGroup
                value={formData.reportType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    reportType: value,
                  }))
                }
              >
                {REPORT_TYPES.map((type) => (
                  <div
                    key={type.value}
                    className="flex items-start space-x-3 p-4 border rounded-lg"
                  >
                    <RadioGroupItem
                      value={type.value}
                      id={type.value}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label htmlFor={type.value} className="font-medium">
                        {type.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {t('credit-passport:steps.selectDateRange', {
                  defaultValue: 'Select Date Range',
                })}
              </h3>
              <RadioGroup
                value={formData.dateRange}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    dateRange: value,
                  }))
                }
              >
                {DATE_PRESETS.map((preset) => (
                  <div
                    key={preset.value}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={preset.value} id={preset.value} />
                    <Label htmlFor={preset.value}>{preset.label}</Label>
                  </div>
                ))}
              </RadioGroup>

              {formData.dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="startDate">
                      {t('common:startDate', { defaultValue: 'Start Date' })}
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">
                      {t('common:endDate', { defaultValue: 'End Date' })}
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {t('credit-passport:steps.selectBatches', {
                  defaultValue: 'Select Batches',
                })}
              </h3>

              {!farmId ? (
                <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  {t('common:selectFarmFirst', {
                    defaultValue:
                      'Please select a farm from the sidebar to view batches.',
                  })}
                </div>
              ) : batches.length === 0 ? (
                <div className="p-4 border border-muted rounded-lg">
                  {t('credit-passport:empty.noBatches', {
                    defaultValue:
                      'No batches found for this farm. Create a batch first to generate a report.',
                  })}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {batches.map((batch: Batch) => (
                    <div
                      key={batch.id}
                      className="flex items-center space-x-2 p-2 border rounded"
                    >
                      <Checkbox
                        id={batch.id}
                        checked={formData.selectedBatches.includes(batch.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData((prev) => ({
                              ...prev,
                              selectedBatches: [
                                ...prev.selectedBatches,
                                batch.id,
                              ],
                            }))
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              selectedBatches: prev.selectedBatches.filter(
                                (id) => id !== batch.id,
                              ),
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={batch.id} className="flex-1">
                        {batch.batchName ||
                          `${batch.species} - ${batch.initialQuantity} units`}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {t('credit-passport:additionalNotes', {
                  defaultValue: 'Additional Notes (Optional)',
                })}
              </h3>
              <Textarea
                placeholder={t('credit-passport:placeholders.reportNotes', {
                  defaultValue:
                    'Add any additional context or specific requirements for this report...',
                })}
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={4}
              />
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {t('credit-passport:previewAndGenerate', {
                  defaultValue: 'Preview & Generate',
                })}
              </h3>
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div>
                  <strong>
                    {t('credit-passport:reportType', {
                      defaultValue: 'Report Type',
                    })}
                    :
                  </strong>{' '}
                  {
                    REPORT_TYPES.find(
                      (reportType) => reportType.value === formData.reportType,
                    )?.label
                  }
                </div>
                <div>
                  <strong>
                    {t('credit-passport:dateRange', {
                      defaultValue: 'Date Range',
                    })}
                    :
                  </strong>{' '}
                  {formData.dateRange === 'custom'
                    ? `${formData.startDate} to ${formData.endDate}`
                    : `Last ${formData.dateRange} days`}
                </div>
                <div>
                  <strong>
                    {t('credit-passport:batches', { defaultValue: 'Batches' })}:
                  </strong>{' '}
                  {formData.selectedBatches.length} selected
                </div>
                {formData.notes && (
                  <div>
                    <strong>
                      {t('common:notes', { defaultValue: 'Notes' })}:
                    </strong>{' '}
                    {formData.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting ? 'Generating...' : 'Download CSV Report'}
                <Download className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
