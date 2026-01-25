import { createFileRoute } from '@tanstack/react-router'
import {
  Boxes,
  ClipboardList,
  DollarSign,
  Layers,
  PlayCircle,
  Plug,
  Settings,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { getSettingsPageDataFn } from '~/features/settings/server'
import { useSettingsTabs } from '~/features/settings/use-settings-tabs'
import { ModulesTab } from '~/components/settings/modules-tab'
import { RegionalTab } from '~/components/settings/regional-tab'
import { PreferencesTab } from '~/components/settings/preferences-tab'
import { NotificationsTab } from '~/components/settings/notifications-tab'
import { BusinessTab } from '~/components/settings/business-tab'
import { IntegrationsTab } from '~/components/settings/integrations-tab'
import { SettingsSkeleton } from '~/components/settings/settings-skeleton'

export const Route = createFileRoute('/_auth/settings/')({
  loader: async () => {
    return getSettingsPageDataFn({ data: {} })
  },
  pendingComponent: SettingsSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-600">
      Error loading settings: {error.message}
    </div>
  ),
  component: SettingsPage,
})

function SettingsPage() {
  const { t } = useTranslation(['settings'])

  // Get data from loader
  const initialSettings = Route.useLoaderData()

  const {
    localSettings,
    saveError,
    saveSuccess,
    isSaving,
    saveSettings,
    handleReset,
    updateLocalSettings,
  } = useSettingsTabs(initialSettings)

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      {saveError && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {saveError}
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
                await resetOnboardingFn({ data: {} })
                localStorage.removeItem('openlivestock_onboarding')
                window.location.href = '/onboarding'
              } catch (err) {
                toast.error('Failed to reset onboarding')
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
