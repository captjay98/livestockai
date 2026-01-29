/**
 * CreateBatchStep - Onboarding step for creating the first batch
 *
 * This step uses BatchDialog in onboarding mode to create the first batch.
 * It passes the farmId, structureId, and enabledModules from context.
 */

import { useTranslation } from 'react-i18next'
import { Package } from 'lucide-react'
import { useOnboarding } from '~/features/onboarding/context'
import { BatchDialog } from '~/components/dialogs/batch-dialog'
import { Button } from '~/components/ui/button'

export function CreateBatchStep() {
  const { t } = useTranslation(['onboarding', 'common', 'batches'])
  const { completeStep, skipStep, progress, setBatchId, enabledModules } =
    useOnboarding()

  // Handle batch creation success
  const handleBatchCreated = (batchId: string) => {
    setBatchId(batchId)
    completeStep('create-batch')
  }

  // If no farm was created, show skip message
  if (!progress.farmId) {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 text-yellow-600">
          <Package className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">
          {t('createBatch.farmFirst.title', {
            defaultValue: 'Create a Farm First',
          })}
        </h2>
        <p className="text-muted-foreground">
          {t('createBatch.farmFirst.desc', {
            defaultValue: 'You need a farm before adding batches.',
          })}
        </p>
        <Button onClick={skipStep}>
          {t('common:continue', { defaultValue: 'Continue anyway' })}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          <Package className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">
          {t('createBatch.title', {
            defaultValue: 'Create Your First Batch',
          })}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('createBatch.desc', {
            defaultValue: 'A batch is a group of livestock acquired together.',
          })}
        </p>
      </div>

      <BatchDialog
        open={true}
        onOpenChange={() => {}}
        onboardingMode={true}
        farmIdOverride={progress.farmId}
        structureIdOverride={progress.structureId}
        enabledModulesFilter={enabledModules}
        onSuccess={handleBatchCreated}
        onSkip={skipStep}
      />
    </div>
  )
}
