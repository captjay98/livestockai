import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { BarChart3, BookOpen, Calculator, DollarSign } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { FormulationCalculator } from '~/components/feed-formulation/formulation-calculator'
import { PriceManager } from '~/components/feed-formulation/price-manager'
import { FormulationComparison } from '~/components/feed-formulation/formulation-comparison'
import { SavedFormulations } from '~/components/feed-formulation/saved-formulations'

export const Route = createFileRoute('/_auth/feed-formulation/')({
    component: FeedFormulationPage,
    head: () => ({
        title: 'Feed Formulation Calculator - OpenLivestock',
        meta: [
            {
                name: 'description',
                content:
                    'Optimize feed formulations with linear programming to reduce costs while meeting nutritional requirements.',
            },
        ],
    }),
})

function FeedFormulationPage() {
    const { t } = useTranslation(['feed-formulation', 'common'])
    const [activeTab, setActiveTab] = useState('calculator')
    const [comparisonFormulations, setComparisonFormulations] = useState<
        Array<string>
    >([])

    const handleSaveFormulation = (formulation: any) => {
        // Switch to saved formulations tab after saving
        setActiveTab('saved')
    }

    const handleSelectForComparison = (formulationId: string) => {
        if (!comparisonFormulations.includes(formulationId)) {
            setComparisonFormulations((prev) =>
                [...prev, formulationId].slice(0, 3),
            )
        }
        setActiveTab('comparison')
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('title', {
                        defaultValue: 'Feed Formulation Calculator',
                    })}
                </h1>
                <p className="text-muted-foreground">
                    {t('description', {
                        defaultValue:
                            'Optimize feed formulations using linear programming to minimize costs while meeting nutritional requirements.',
                    })}
                </p>
            </div>

            {/* Main Content */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
            >
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger
                        value="calculator"
                        className="flex items-center gap-2 h-12"
                    >
                        <Calculator className="h-4 w-4" />
                        <span className="hidden sm:inline">
                            {t('tabs.calculator', {
                                defaultValue: 'Calculator',
                            })}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="prices"
                        className="flex items-center gap-2 h-12"
                    >
                        <DollarSign className="h-4 w-4" />
                        <span className="hidden sm:inline">
                            {t('tabs.prices', { defaultValue: 'Prices' })}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="comparison"
                        className="flex items-center gap-2 h-12"
                    >
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">
                            {t('tabs.comparison', { defaultValue: 'Compare' })}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="saved"
                        className="flex items-center gap-2 h-12"
                    >
                        <BookOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">
                            {t('tabs.saved', { defaultValue: 'Saved' })}
                        </span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="calculator" className="space-y-6">
                    <FormulationCalculator
                        onSaveFormulation={handleSaveFormulation}
                    />
                </TabsContent>

                <TabsContent value="prices" className="space-y-6">
                    <PriceManager />
                </TabsContent>

                <TabsContent value="comparison" className="space-y-6">
                    <FormulationComparison
                        selectedFormulations={comparisonFormulations}
                        onSelectionChange={setComparisonFormulations}
                    />
                </TabsContent>

                <TabsContent value="saved" className="space-y-6">
                    <SavedFormulations
                        onSelectForComparison={handleSelectForComparison}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
