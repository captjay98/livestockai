import { useState } from 'react'
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

interface IntegrationsTabProps {
  integrations?: Array<IntegrationStatus>
}

export function IntegrationsTab({ integrations = [] }: IntegrationsTabProps) {
  const { t } = useTranslation(['settings', 'common'])
  const [testEmail, setTestEmail] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isSendingSMS, setIsSendingSMS] = useState(false)

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error(t('integrations.messages.enterEmail'))
      return
    }
    setIsSendingEmail(true)
    try {
      const { testEmailFn } = await import('~/features/integrations')
      const result = await testEmailFn({ data: { to: testEmail } })
      if (result.success) {
        toast.success(t('integrations.messages.testEmailSuccess'))
      } else {
        toast.error(result.error || t('integrations.messages.testEmailFailed'))
      }
    } catch {
      toast.error(t('integrations.messages.testEmailFailed'))
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleTestSMS = async () => {
    if (!testPhone) {
      toast.error(t('integrations.messages.enterPhone'))
      return
    }
    setIsSendingSMS(true)
    try {
      const { testSMSFn } = await import('~/features/integrations')
      const result = await testSMSFn({ data: { to: testPhone } })
      if (result.success) {
        toast.success(t('integrations.messages.testSMSSuccess'))
      } else {
        toast.error(result.error || t('integrations.messages.testSMSFailed'))
      }
    } catch {
      toast.error(t('integrations.messages.testSMSFailed'))
    } finally {
      setIsSendingSMS(false)
    }
  }

  const emailIntegration = integrations.find((i) => i.type === 'email')
  const smsIntegration = integrations.find((i) => i.type === 'sms')

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-6 space-y-4 bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl">
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
              placeholder={t('placeholders.emailPlaceholder', {
                defaultValue: 'your@email.com',
              })}
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
          <div className="bg-white/20 dark:bg-white/5 p-3 rounded-xl border border-white/10">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              {t('common:setupRequired', { defaultValue: 'Setup Required' })}
            </p>
            <code className="text-xs font-mono bg-black/20 dark:bg-white/10 px-1.5 py-0.5 rounded">
              EMAIL_PROVIDER=smtp
            </code>
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
              placeholder={t('placeholders.smsPlaceholder', {
                defaultValue: '+234...',
              })}
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
          <div className="bg-white/20 dark:bg-white/5 p-3 rounded-xl border border-white/10">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              {t('common:setupRequired', { defaultValue: 'Setup Required' })}
            </p>
            <code className="text-xs font-mono bg-black/20 dark:bg-white/10 px-1.5 py-0.5 rounded">
              SMS_PROVIDER=termii
            </code>
          </div>
        )}
      </Card>

      <Card className="p-4 sm:p-6 bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/20 dark:border-white/10 shadow-sm rounded-2xl border-l-4 border-l-primary/50">
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
