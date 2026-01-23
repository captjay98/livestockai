import { createFileRoute } from '@tanstack/react-router'
import {
  Boxes,
  ClipboardList,
  DollarSign,
  Layers,
  Loader2,
  PlayCircle,
  Plug,
  Settings,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useSettingsTabs } from '~/features/settings/use-settings-tabs'
import { ModulesTab } from '~/components/settings/modules-tab'
import { RegionalTab } from '~/components/settings/regional-tab'
import { PreferencesTab } from '~/components/settings/preferences-tab'
import { NotificationsTab } from '~/components/settings/notifications-tab'
import { BusinessTab } from '~/components/settings/business-tab'
import { IntegrationsTab } from '~/components/settings/integrations-tab'

export const Route = createFileRoute('/_auth/settings/')({
  component: SettingsPage,
})

function SettingsPage() {
  const { t } = useTranslation(['settings'])
  const {
    localSettings,
    isLoading,
    error,
    saveError,
    saveSuccess,
    isSaving,
    saveSettings,
    handleReset,
    updateLocalSettings,
  } = useSettingsTabs()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      {(error || saveError) && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error || saveError}
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-500/10 text-green-600 px-4 py-3 rounded-md">
          {t('saved')}
        </div>
      )}

      <Tabs defaultValue="regional" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="regional" className="gap-2">
            <DollarSign className="h-4 w-4" />
            {t('tabs.regional')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="h-4 w-4" />
            {t('tabs.preferences')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            {t('tabs.notifications')}
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Boxes className="h-4 w-4" />
            {t('tabs.business')}
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-2">
            <Layers className="h-4 w-4" />
            {t('tabs.modules')}
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            {t('tabs.integrations')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regional">
          <RegionalTab
            settings={localSettings}
            onSettingsChange={updateLocalSettings}
            onSave={saveSettings}
            onReset={handleReset}
            isSaving={isSaving}
          />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesTab
            settings={localSettings}
            onSettingsChange={updateLocalSettings}
            onSave={saveSettings}
            isSaving={isSaving}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab
            settings={localSettings}
            onSettingsChange={updateLocalSettings}
            onSave={saveSettings}
            isSaving={isSaving}
          />
        </TabsContent>

        <TabsContent value="business">
          <BusinessTab
            settings={localSettings}
            onSettingsChange={updateLocalSettings}
            onSave={saveSettings}
            isSaving={isSaving}
          />
        </TabsContent>

        <TabsContent value="modules">
          <ModulesTab />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>
      </Tabs>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{t('help.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('help.description')}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const { resetOnboardingFn } =
                  await import('~/features/onboarding/server')
                await resetOnboardingFn()
                localStorage.removeItem('openlivestock_onboarding')
                window.location.href = '/onboarding'
              } catch (err) {
                console.error('Failed to reset onboarding:', err)
              }
            }}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            {t('help.restart')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
