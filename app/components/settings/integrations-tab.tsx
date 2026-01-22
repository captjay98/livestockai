import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  XCircle,
} from 'lucide-react'
import type { IntegrationStatus } from '~/features/integrations'
import { Card } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'

export function IntegrationsTab() {
  const { t } = useTranslation(['settings', 'common'])
  const [integrations, setIntegrations] = useState<Array<IntegrationStatus>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [testEmail, setTestEmail] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isSendingSMS, setIsSendingSMS] = useState(false)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      const { getIntegrationStatusFn } = await import('~/features/integrations')
      const status = await getIntegrationStatusFn()
      setIntegrations(status)
    } catch (error) {
      console.error('Failed to load integrations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address')
      return
    }
    setIsSendingEmail(true)
    try {
      const { testEmailFn } = await import('~/features/integrations')
      const result = await testEmailFn({ data: { to: testEmail } })
      if (result.success) {
        toast.success('Test email sent!')
      } else {
        toast.error(result.error || 'Failed to send email')
      }
    } catch {
      toast.error('Failed to send test email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleTestSMS = async () => {
    if (!testPhone) {
      toast.error('Please enter a phone number')
      return
    }
    setIsSendingSMS(true)
    try {
      const { testSMSFn } = await import('~/features/integrations')
      const result = await testSMSFn({ data: { to: testPhone } })
      if (result.success) {
        toast.success('Test SMS sent!')
      } else {
        toast.error(result.error || 'Failed to send SMS')
      }
    } catch {
      toast.error('Failed to send test SMS')
    } finally {
      setIsSendingSMS(false)
    }
  }

  const emailIntegration = integrations.find((i) => i.type === 'email')
  const smsIntegration = integrations.find((i) => i.type === 'sms')

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5" />
          <div className="flex-1">
            <h3 className="font-semibold">
              {t('integrations.email')}
              {emailIntegration?.provider
                ? ` (${emailIntegration.provider})`
                : ''}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('integrations.emailDesc')}
            </p>
          </div>
          {emailIntegration?.configured ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {emailIntegration?.configured ? (
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleTestEmail} disabled={isSendingEmail}>
              {isSendingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs text-muted-foreground mb-2">
              Add to your .env file:
            </p>
            <code className="text-xs">EMAIL_PROVIDER=smtp</code>
            <p className="text-xs text-muted-foreground mt-2">
              Options: <code>smtp</code> (Mailpit, Gmail), <code>resend</code>
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5" />
          <div className="flex-1">
            <h3 className="font-semibold">
              {t('integrations.sms')}
              {smsIntegration?.provider ? ` (${smsIntegration.provider})` : ''}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('integrations.smsDesc')}
            </p>
          </div>
          {smsIntegration?.configured ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {smsIntegration?.configured ? (
          <div className="flex gap-2">
            <Input
              type="tel"
              placeholder="+234..."
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleTestSMS} disabled={isSendingSMS}>
              {isSendingSMS ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs text-muted-foreground mb-2">
              Add to your .env file:
            </p>
            <code className="text-xs">SMS_PROVIDER=termii</code>
            <p className="text-xs text-muted-foreground mt-2">
              Options: <code>termii</code> (Africa), <code>twilio</code>{' '}
              (Global)
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h4 className="font-medium mb-2">{t('integrations.howItWorks')}</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• {t('integrations.howItWorksDesc1')}</li>
          <li>• {t('integrations.howItWorksDesc2')}</li>
          <li>• {t('integrations.howItWorksDesc3')}</li>
        </ul>
      </Card>
    </div>
  )
}
