import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, ChevronDown, ChevronUp, FileText, User } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { acknowledgeVisitFn } from '~/features/visits/server'
import { useErrorMessage } from '~/hooks/useErrorMessage'

interface Visit {
  id: string
  visitDate: Date
  visitType: string
  agentName: string
  findings: string
  recommendations: string | null
  followUpDate: Date | null
  acknowledgedAt: Date | null
  attachments: Array<string> | null
}

interface VisitHistoryCardProps {
  farmId: string
  visits?: Array<Visit>
}

export function VisitHistoryCard({ farmId, visits = [] }: VisitHistoryCardProps) {
  const { t } = useTranslation(['extension', 'common'])
  const getErrorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set())

  const acknowledgeMutation = useMutation({
    mutationFn: (visitId: string) =>
      acknowledgeVisitFn({ data: { visitId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-details', farmId] })
      toast.success(
        t('extension:visitHistory.acknowledged', {
          defaultValue: 'Visit acknowledged',
        }),
      )
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const toggleExpand = (visitId: string) => {
    setExpandedVisits((prev) => {
      const next = new Set(prev)
      if (next.has(visitId)) {
        next.delete(visitId)
      } else {
        next.add(visitId)
      }
      return next
    })
  }

  const getVisitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      routine: t('extension:visitTypes.routine', { defaultValue: 'Routine Check' }),
      health: t('extension:visitTypes.health', { defaultValue: 'Health Assessment' }),
      vaccination: t('extension:visitTypes.vaccination', { defaultValue: 'Vaccination' }),
      emergency: t('extension:visitTypes.emergency', { defaultValue: 'Emergency' }),
      training: t('extension:visitTypes.training', { defaultValue: 'Training' }),
    }
    return labels[type] || type
  }

  if (visits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('extension:visitHistory.title', {
              defaultValue: 'Visit History',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('extension:visitHistory.empty', {
              defaultValue: 'No visits recorded yet',
            })}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t('extension:visitHistory.title', {
            defaultValue: 'Visit History',
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visits.map((visit) => {
          const isExpanded = expandedVisits.has(visit.id)
          const isUnacknowledged = !visit.acknowledgedAt

          return (
            <Card
              key={visit.id}
              className={isUnacknowledged ? 'border-amber-200 bg-amber-50/50' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(visit.visitDate).toLocaleDateString()}
                      </span>
                      <Badge variant="outline">
                        {getVisitTypeLabel(visit.visitType)}
                      </Badge>
                      {isUnacknowledged && (
                        <Badge variant="secondary">
                          {t('extension:visitHistory.unacknowledged', {
                            defaultValue: 'New',
                          })}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{visit.agentName}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(visit.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      {t('extension:visitHistory.findings', {
                        defaultValue: 'Findings',
                      })}
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {visit.findings}
                    </p>
                  </div>

                  {visit.recommendations && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">
                        {t('extension:visitHistory.recommendations', {
                          defaultValue: 'Recommendations',
                        })}
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {visit.recommendations}
                      </p>
                    </div>
                  )}

                  {visit.followUpDate && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">
                        {t('extension:visitHistory.followUp', {
                          defaultValue: 'Follow-up Date',
                        })}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(visit.followUpDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {visit.attachments && visit.attachments.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">
                        {t('extension:visitHistory.attachments', {
                          defaultValue: 'Attachments',
                        })}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {visit.attachments.map((url, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              {t('extension:visitHistory.attachment', {
                                defaultValue: 'Attachment',
                              })}{' '}
                              {index + 1}
                            </a>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isUnacknowledged && (
                    <Button
                      onClick={() => acknowledgeMutation.mutate(visit.id)}
                      disabled={acknowledgeMutation.isPending}
                      className="w-full"
                      size="sm"
                    >
                      {acknowledgeMutation.isPending
                        ? t('common:acknowledging', {
                            defaultValue: 'Acknowledging...',
                          })
                        : t('extension:visitHistory.acknowledge', {
                            defaultValue: 'Acknowledge Visit',
                          })}
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </CardContent>
    </Card>
  )
}
