import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useFeedMutations } from './mutations'
import type { FeedType } from '~/features/feed/constants'

export function useFeedInventory(selectedFarmId: string | null) {
  const { t } = useTranslation(['errors'])
  const {
    createFeed: createFeedM,
    updateFeed: updateFeedM,
    deleteFeed: deleteFeedM,
    isPending: isSubmitting,
  } = useFeedMutations()

  const createFeed = async (data: {
    feedType: FeedType
    quantityKg: number
    minThresholdKg: number
  }) => {
    if (!selectedFarmId) {
      toast.error(
        t('errors:noFarmSelected', {
          defaultValue: 'No farm selected',
        }),
      )
      return
    }
    await createFeedM.mutateAsync({ farmId: selectedFarmId, ...data })
  }

  const updateFeed = async (
    id: string,
    data: {
      quantityKg: number
      minThresholdKg: number
    },
  ) => {
    await updateFeedM.mutateAsync({ id, ...data })
  }

  const deleteFeed = async (id: string) => {
    await deleteFeedM.mutateAsync(id)
  }

  return {
    isSubmitting,
    createFeed,
    updateFeed,
    deleteFeed,
  }
}
