import { formatDistanceToNow } from 'date-fns'
import { Check, Mail, MessageSquare, Phone, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ContactRequestRecord } from '~/features/marketplace/repository'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'

interface RequestCardProps {
  request: ContactRequestRecord
  onApprove?: (message?: string) => void
  onDeny?: (message?: string) => void
}

const statusColors = {
  pending: 'warning',
  approved: 'success',
  denied: 'destructive',
} as const

const contactMethodIcons = {
  app: MessageSquare,
  phone: Phone,
  email: Mail,
}

export function RequestCard({ request, onApprove, onDeny }: RequestCardProps) {
  const { t } = useTranslation('marketplace')
  const ContactIcon = contactMethodIcons[request.contactMethod]
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ContactIcon className="h-4 w-4" />
            <span className="font-medium">{t('contactRequest')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusColors[request.status]}>
              {request.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">{t('message')}:</p>
          <p className="text-sm text-muted-foreground">{request.message}</p>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <span>
            <strong>{t('method')}:</strong> {request.contactMethod}
          </span>
          {request.phoneNumber && (
            <span>
              <strong>{t('phone')}:</strong> {request.phoneNumber}
            </span>
          )}
          {request.email && (
            <span>
              <strong>{t('email')}:</strong> {request.email}
            </span>
          )}
        </div>
        
        {request.responseMessage && (
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-1">{t('response')}:</p>
            <p className="text-sm text-muted-foreground">{request.responseMessage}</p>
            {request.respondedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Responded {formatDistanceToNow(new Date(request.respondedAt), { addSuffix: true })}
              </p>
            )}
          </div>
        )}
        
        {request.status === 'pending' && (onApprove || onDeny) && (
          <div className="flex gap-2 pt-2">
            {onApprove && (
              <Button
                size="sm"
                onClick={() => onApprove()}
                className="flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                {t('approve')}
              </Button>
            )}
            {onDeny && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDeny()}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                {t('deny')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}