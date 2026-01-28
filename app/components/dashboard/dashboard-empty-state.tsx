import { useTranslation } from 'react-i18next'
import { Package, Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

interface DashboardEmptyStateProps {
    selectedFarmId: string | null
    onCreateBatch: () => void
}

export function DashboardEmptyState({
    selectedFarmId,
    onCreateBatch,
}: DashboardEmptyStateProps) {
    const { t } = useTranslation(['dashboard', 'batches'])

    return (
        <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="py-12 sm:py-16 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                    {t('noDataTitle', {
                        defaultValue: 'No data available yet',
                    })}
                </h3>
                <p className="text-muted-foreground mb-4">
                    {t('noDataDescription', {
                        defaultValue:
                            'Start adding batches to see your metrics.',
                    })}
                </p>
                <Button onClick={() => selectedFarmId && onCreateBatch()}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('batches:create', {
                        defaultValue: 'Add Your First Batch',
                    })}
                </Button>
            </CardContent>
        </Card>
    )
}
