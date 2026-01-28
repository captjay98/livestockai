import { useTranslation } from 'react-i18next'
import { SkipForward, Sparkles } from 'lucide-react'
import { useOnboarding } from '~/features/onboarding/context'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'

interface OnboardingLayoutProps {
    children: React.ReactNode
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
    const { t } = useTranslation(['onboarding'])
    const { currentStepIndex, totalSteps, skipOnboarding } = useOnboarding()

    const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
                <div className="container max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <span className="font-semibold">
                                {t('header.title', {
                                    defaultValue: 'Getting Started',
                                })}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={skipOnboarding}
                        >
                            <SkipForward className="h-4 w-4 mr-1" />
                            {t('header.skip', { defaultValue: 'Skip Setup' })}
                        </Button>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>
                            {t('header.step', {
                                defaultValue: 'Step {{current}} of {{total}}',
                                current: currentStepIndex + 1,
                                total: totalSteps,
                            })}
                        </span>
                        <span>
                            {t('header.percent', {
                                defaultValue: '{{percent}}% complete',
                                percent: Math.round(progressPercent),
                            })}
                        </span>
                    </div>
                </div>
            </div>
            <div className="container max-w-3xl mx-auto px-4 py-8">
                {children}
            </div>
        </div>
    )
}
