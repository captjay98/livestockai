import { useTranslation } from 'react-i18next'
import { Boxes } from 'lucide-react'
import { Card } from '~/components/ui/card'
import { ModuleSelector } from '~/components/modules/selector'

/**
 * ModulesTab - Settings tab for managing enabled livestock modules
 */
export function ModulesTab() {
    const { t } = useTranslation(['settings'])

    return (
        <Card className="p-6 space-y-6">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Boxes className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">
                        {t('modules.title')}
                    </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    {t('modules.description')}
                </p>
            </div>

            <ModuleSelector />
        </Card>
    )
}
