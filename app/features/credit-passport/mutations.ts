import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { deleteReportFn, downloadReportFn } from './server'

export const CREDIT_PASSPORT_QUERY_KEYS = {
  all: ['credit-passport'] as const,
  reports: () => [...CREDIT_PASSPORT_QUERY_KEYS.all, 'reports'] as const,
  history: () => [...CREDIT_PASSPORT_QUERY_KEYS.all, 'history'] as const,
} as const

export function useCreditPassportMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation(['credit-passport', 'common'])

  const deleteReport = useMutation({
    mutationFn: (data: { reportId: string }) => deleteReportFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CREDIT_PASSPORT_QUERY_KEYS.all,
      })
      toast.success(
        t('credit-passport:reportDeleted', {
          defaultValue: 'Report deleted successfully',
        }),
      )
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : t('credit-passport:deleteFailed', {
              defaultValue: 'Failed to delete report',
            }),
      )
    },
  })

  const downloadReport = useMutation({
    mutationFn: async (data: { reportId: string }) => {
      const result = (await downloadReportFn({ data })) as {
        content: string
        contentType: string
      }
      // Convert base64 content to blob and trigger download
      const binaryString = atob(result.content)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: result.contentType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `credit-passport-${data.reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return result
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : t('credit-passport:downloadFailed', {
              defaultValue: 'Failed to download report',
            }),
      )
    },
  })

  return {
    deleteReport,
    downloadReport,
    isPending: deleteReport.isPending || downloadReport.isPending,
  }
}
