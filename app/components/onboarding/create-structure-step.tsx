import { useTranslation } from 'react-i18next'
import { ArrowRight, Home } from 'lucide-react'
import { useOnboarding } from '~/features/onboarding/context'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

export function CreateStructureStep() {
  const { t } = useTranslation(['onboarding', 'common', 'farms', 'batches'])
  const { completeStep, skipStep } = useOnboarding()
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          <Home className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">
          {t('createStructure.title', { defaultValue: 'Farm Organization' })}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('createStructure.desc', {
            defaultValue: 'How OpenLivestock organizes your data.',
          })}
        </p>
      </div>
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6 space-y-4">
          {[
            {
              n: '1',
              t: t('farms:title', { defaultValue: 'Farm' }),
              d: t('createStructure.items.farm', {
                defaultValue: 'Your top-level workspace',
              }),
            },
            {
              n: '2',
              t: t('batches:title', { defaultValue: 'Batches' }),
              d: t('createStructure.items.batches', {
                defaultValue: 'Groups of livestock acquired together',
              }),
            },
            {
              n: '3',
              t: t('createStructure.items.recordsTitle', {
                defaultValue: 'Records',
              }),
              d: t('createStructure.items.records', {
                defaultValue: 'Daily entries for feed, mortality, weights',
              }),
            },
          ].map((i) => (
            <div key={i.n} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{i.n}</span>
              </div>
              <div>
                <h4 className="font-semibold">{i.t}</h4>
                <p className="text-sm text-muted-foreground">{i.d}</p>
              </div>
            </div>
          ))}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm">
              <strong>{t('common:tip', { defaultValue: 'Tip' })}:</strong>{' '}
              {t('createStructure.tip', {
                defaultValue:
                  'Start by creating a batch for your current livestock.',
              })}
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={skipStep}>
          {t('common:skip', { defaultValue: 'Skip' })}
        </Button>
        <Button onClick={() => completeStep('create-structure')}>
          {t('createStructure.submit', { defaultValue: 'Got it' })}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
