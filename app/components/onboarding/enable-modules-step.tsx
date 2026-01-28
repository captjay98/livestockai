import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, Layers } from 'lucide-react'
import type { ModuleKey } from '~/features/modules/types'
import { useOnboarding } from '~/features/onboarding/context'
import { MODULE_METADATA } from '~/features/modules/constants'
import { Button } from '~/components/ui/button'

export function EnableModulesStep() {
    const { t } = useTranslation(['onboarding', 'common'])
    const { completeStep, skipStep, progress } = useOnboarding()
    const [selectedModules, setSelectedModules] = useState<Array<ModuleKey>>([
        'poultry',
        'aquaculture',
    ])

    if (!progress.farmId) {
        return (
            <div className="space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground">
                        <Layers className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold">
                        {t('enableModules.title', {
                            defaultValue: 'Module Selection',
                        })}
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        {t('enableModules.descEmpty', {
                            defaultValue:
                                'Create a farm first to enable livestock modules.',
                        })}
                    </p>
                </div>
                <div className="flex justify-center gap-3 pt-4">
                    <Button variant="outline" onClick={skipStep}>
                        {t('common:skip', { defaultValue: 'Skip' })}{' '}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    const allModules: Array<{ key: ModuleKey; available: boolean }> = [
        { key: 'poultry', available: true },
        { key: 'aquaculture', available: true },
        { key: 'cattle', available: true },
        { key: 'goats', available: true },
        { key: 'sheep', available: true },
        { key: 'bees', available: true },
    ]

    const handleToggle = (key: ModuleKey) => {
        setSelectedModules((p) =>
            p.includes(key) ? p.filter((k) => k !== key) : [...p, key],
        )
    }

    const handleContinue = () => {
        completeStep('enable-modules')
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                    <Layers className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold">
                    {t('enableModules.title', {
                        defaultValue: 'Choose Your Modules',
                    })}
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    {t('enableModules.desc', {
                        defaultValue: 'Select the livestock types you manage.',
                    })}
                </p>
            </div>
            <div className="grid gap-3 max-w-lg mx-auto">
                {allModules.map(({ key, available }) => {
                    const m = MODULE_METADATA[key]
                    const selected = selectedModules.includes(key)
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => available && handleToggle(key)}
                            disabled={!available}
                            className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'} ${!available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="text-3xl">{m.icon}</div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">
                                        {m.name}
                                    </span>
                                    {!available && (
                                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                            {t('common:comingSoon', {
                                                defaultValue: 'Coming Soon',
                                            })}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {m.description}
                                </p>
                            </div>
                            {selected && available && (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="h-4 w-4 text-primary-foreground" />
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
            <div className="flex justify-center gap-3 pt-4">
                <Button variant="outline" onClick={skipStep}>
                    {t('common:skip', { defaultValue: 'Skip' })}
                </Button>
                <Button
                    onClick={handleContinue}
                    disabled={selectedModules.length === 0}
                >
                    {t('common:continue', { defaultValue: 'Continue' })}{' '}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
