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
import { PageHeader } from '~/components/page-header'
import { getSettingsPageDataFn } from '~/features/settings/server'
import { useSettingsTabs } from '~/features/settings/use-settings-tabs'
import { ModulesTab } from '~/components/settings/modules-tab'
import { RegionalTab } from '~/components/settings/regional-tab'
import { PreferencesTab } from '~/components/settings/preferences-tab'
import { NotificationsTab } from '~/components/settings/notifications-tab'
import { BusinessTab } from '~/components/settings/business-tab'
import { IntegrationsTab } from '~/components/settings/integrations-tab'
import { SettingsSkeleton } from '~/components/settings/settings-skeleton'
import { ErrorPage } from '~/components/error-page'

export const Route = createFileRoute('/_auth/settings/')({
  loader: async () => {
    return getSettingsPageDataFn({ data: {} })
  },
  pendingComponent: SettingsSkeleton,
  errorComponent: ({ error, reset }) => (
    <ErrorPage error={error} reset={reset} />
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
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        icon={Settings}
      />

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

      <Tabs defaultValue="regional" className="space-y-6">
        <TabsList className="bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 p-1.5 rounded-2xl h-auto flex flex-wrap gap-1 shadow-sm">
          <TabsTrigger
            value="regional"
            className="gap-2 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-white/10 transition-all px-4 py-2.5"
          >
            <DollarSign className="h-4 w-4" />
            {t('tabs.regional')}
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="gap-2 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-white/10 transition-all px-4 py-2.5"
          >
            <Settings className="h-4 w-4" />
            {t('tabs.preferences')}
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="gap-2 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-white/10 transition-all px-4 py-2.5"
          >
            <ClipboardList className="h-4 w-4" />
            {t('tabs.notifications')}
          </TabsTrigger>
          <TabsTrigger
            value="business"
            className="gap-2 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-white/10 transition-all px-4 py-2.5"
          >
            <Boxes className="h-4 w-4" />
            {t('tabs.business')}
          </TabsTrigger>
          <TabsTrigger
            value="modules"
            className="gap-2 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-white/10 transition-all px-4 py-2.5"
          >
            <Layers className="h-4 w-4" />
            {t('tabs.modules')}
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="gap-2 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-white/10 transition-all px-4 py-2.5"
          >
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

      <Card className="p-8 bg-white/30 dark:bg-black/80 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-3xl shadow-xl border relative overflow-hidden group">
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-black tracking-tight mb-1">
              {t('help.title')}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              {t('help.description')}
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl font-bold bg-white/50 dark:bg-white/5 border-white/20 hover:bg-white/70 shadow-sm"
            onClick={async () => {
              try {
                const { resetOnboardingFn } =
                  await import('~/features/onboarding/server')
                await resetOnboardingFn({ data: {} })
                localStorage.removeItem('livestockai_onboarding')
                window.location.href = '/onboarding'
              } catch (err) {
                toast.error(
                  t('settings:help.resetOnboardingFailed', {
                    defaultValue: 'Failed to reset onboarding',
                  }),
                )
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
